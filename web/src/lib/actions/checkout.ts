"use server";

import { isValidObjectId } from "mongoose";
import { updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Order, OrderItem } from "@/lib/models/order";
import { Product } from "@/lib/models/product";
import {
  createRazorpayOrder,
  isRazorpayEnabled,
  razorpayKeyId,
  verifyRazorpaySignature,
} from "@/lib/payments";
import { calculateTotals } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { addressSchema, fieldErrors, type FieldErrors } from "@/lib/validation";

const orderInputSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().refine(isValidObjectId),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
  address: addressSchema,
  paymentMethod: z.enum(["cod", "razorpay"]),
});

export type PlaceOrderInput = z.input<typeof orderInputSchema>;

export type PlaceOrderResult =
  | { ok: false; message: string; errors?: FieldErrors }
  | { ok: true; orderId: string; payment: null }
  | {
      ok: true;
      orderId: string;
      payment: {
        keyId: string;
        razorpayOrderId: string;
        amountPaise: number;
        name: string;
        email: string;
        phone: string;
      };
    };

type Line = { id: string; name: string; price: number; quantity: number };

/**
 * Take stock for every line. If one product runs out half-way, everything
 * taken so far is put back and the name of that product is returned.
 */
async function reserveStock(lines: Line[]): Promise<string | null> {
  const taken: Line[] = [];
  for (const line of lines) {
    const result = await Product.updateOne(
      { _id: line.id, stock: { $gte: line.quantity } },
      { $inc: { stock: -line.quantity } },
    );
    if (result.modifiedCount === 0) {
      await releaseStock(taken);
      return line.name;
    }
    taken.push(line);
  }
  return null;
}

async function releaseStock(lines: { id: string; quantity: number }[]) {
  await Promise.all(
    lines.map((line) =>
      Product.updateOne({ _id: line.id }, { $inc: { stock: line.quantity } }),
    ),
  );
}

/**
 * Create an order.
 *
 * The browser only says WHICH products and HOW MANY. Names, prices and totals
 * are looked up and calculated here, so a customer cannot change what they pay
 * by editing the request.
 */
export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please log in to place your order." };

  if (!(await rateLimit(`order:${await clientIp()}`, 20, 10 * 60))) {
    return { ok: false, message: "Too many orders in a short time. Please wait a few minutes." };
  }

  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) {
    const addressIssues = parsed.error.issues.filter((i) => i.path[0] === "address");
    const errors: FieldErrors = {};
    for (const issue of addressIssues) {
      const key = String(issue.path[1] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return {
      ok: false,
      message: addressIssues.length
        ? "Please check the highlighted fields."
        : "Your cart could not be read. Please refresh and try again.",
      errors: addressIssues.length ? errors : fieldErrors(parsed.error),
    };
  }
  const { items, address, paymentMethod } = parsed.data;

  if (paymentMethod === "razorpay" && !isRazorpayEnabled()) {
    return { ok: false, message: "Online payment is not available right now. Please choose cash on delivery." };
  }

  await connectDb();

  // Merge duplicate ids, then load the real products.
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(item.id, Math.min((quantities.get(item.id) ?? 0) + item.quantity, 10));
  }
  const products = await Product.find({
    _id: { $in: [...quantities.keys()] },
    is_active: { $ne: false },
  })
    .select("name price stock")
    .lean();

  if (products.length !== quantities.size) {
    return {
      ok: false,
      message: "Some items in your cart are no longer available. Please review your cart.",
    };
  }

  const lines: Line[] = products.map((p) => ({
    id: String(p._id),
    name: p.name,
    price: p.price,
    quantity: quantities.get(String(p._id)) ?? 1,
  }));

  const short = products.find((p) => (p.stock ?? 0) < (quantities.get(String(p._id)) ?? 1));
  if (short) {
    return { ok: false, message: `"${short.name}" does not have enough stock left.` };
  }

  const totals = calculateTotals(lines);

  // Cash on delivery takes stock now. Online orders take it once paid.
  if (paymentMethod === "cod") {
    const soldOut = await reserveStock(lines);
    if (soldOut) {
      return { ok: false, message: `"${soldOut}" just sold out. Please update your cart.` };
    }
  }

  const order = await Order.create({
    user_id: user.id,
    full_name: address.fullName,
    email: address.email,
    phone: address.phone,
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    state: address.state,
    country: "India",
    postal: address.postal,
    payment_method: paymentMethod,
    payment_status: "pending",
    status: paymentMethod === "cod" ? "placed" : "pending_payment",
    ...totals,
  });

  await OrderItem.insertMany(
    lines.map((line) => ({
      order_id: order._id,
      product_id: line.id,
      name: line.name,
      price: line.price,
      quantity: line.quantity,
    })),
  );

  const orderId = String(order._id);

  if (paymentMethod === "cod") {
    updateTag("products");
    return { ok: true, orderId, payment: null };
  }

  try {
    const razorpayOrderId = await createRazorpayOrder(totals.total, orderId);
    await Order.updateOne({ _id: order._id }, { razorpay_order_id: razorpayOrderId });
    return {
      ok: true,
      orderId,
      payment: {
        keyId: razorpayKeyId()!,
        razorpayOrderId,
        amountPaise: totals.total * 100,
        name: address.fullName,
        email: address.email,
        phone: address.phone,
      },
    };
  } catch (error) {
    console.error("Could not start Razorpay payment.", error);
    await Order.updateOne({ _id: order._id }, { status: "cancelled", payment_status: "failed" });
    return { ok: false, message: "We could not start the payment. Please try again or choose cash on delivery." };
  }
}

const confirmSchema = z.object({
  orderId: z.string().refine(isValidObjectId),
  razorpayOrderId: z.string().min(1).max(100),
  razorpayPaymentId: z.string().min(1).max(100),
  signature: z.string().min(1).max(200),
});

/** Called after the Razorpay window reports success. Verifies it before trusting it. */
export async function confirmPaymentAction(
  input: z.input<typeof confirmSchema>,
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please log in again." };

  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Payment details were incomplete." };
  const { orderId, razorpayOrderId, razorpayPaymentId, signature } = parsed.data;

  await connectDb();
  const order = await Order.findOne({ _id: orderId, user_id: user.id });
  if (!order || order.razorpay_order_id !== razorpayOrderId) {
    return { ok: false, message: "We could not find this order." };
  }
  if (order.payment_status === "paid") return { ok: true };

  if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, signature)) {
    return { ok: false, message: "The payment could not be verified. If money was taken, contact support with your order number." };
  }

  const items = await OrderItem.find({ order_id: order._id }).lean();
  const soldOut = await reserveStock(
    items.map((i) => ({
      id: i.product_id ?? "",
      name: i.name ?? "An item",
      price: i.price ?? 0,
      quantity: i.quantity ?? 1,
    })),
  );

  order.payment_status = "paid";
  order.razorpay_payment_id = razorpayPaymentId;
  order.status = "placed";
  await order.save();
  updateTag("products");

  if (soldOut) {
    // Paid, but stock ran out in the meantime: keep the order and let staff resolve it.
    console.error(`Order ${orderId} was paid but "${soldOut}" is out of stock.`);
  }
  return { ok: true };
}

/** The customer closed the payment window: cancel the unpaid order. */
export async function abandonPaymentAction(orderId: string) {
  const user = await getCurrentUser();
  if (!user || !isValidObjectId(orderId)) return;
  await connectDb();
  await Order.updateOne(
    { _id: orderId, user_id: user.id, status: "pending_payment" },
    { status: "cancelled", payment_status: "failed" },
  );
}
