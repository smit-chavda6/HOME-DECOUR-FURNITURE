import "server-only";
import { isValidObjectId, Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { Order, OrderItem } from "@/lib/models/order";
import { Product } from "@/lib/models/product";
import { Review } from "@/lib/models/review";
import { assetUrl } from "@/lib/utils";

/** Order reads. Never cached: they are private and change often. */

export type OrderLine = {
  productId: string;
  slug: string | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  /** The signed-in user's own rating for this product, if they reviewed it. */
  myRating: number | null;
  myComment: string;
};

export type OrderView = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  lines: OrderLine[];
};

type LeanOrder = {
  _id: Types.ObjectId;
  status?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  created_at?: Date | null;
  subtotal?: number | null;
  shipping?: number | null;
  tax?: number | null;
  total?: number | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postal?: string | null;
};

async function hydrate(orders: LeanOrder[], reviewerId?: string): Promise<OrderView[]> {
  if (orders.length === 0) return [];

  const items = await OrderItem.find({
    order_id: { $in: orders.map((o) => o._id) },
  }).lean();

  const productIds = [
    ...new Set(items.map((i) => i.product_id).filter((id) => isValidObjectId(id))),
  ] as string[];

  const [products, reviews] = await Promise.all([
    Product.find({ _id: { $in: productIds } })
      .select("slug thumbnail image")
      .lean(),
    reviewerId
      ? Review.find({ user_id: reviewerId, product_id: { $in: productIds } }).lean()
      : [],
  ]);
  const productById = new Map(products.map((p) => [String(p._id), p]));
  const reviewByProduct = new Map(reviews.map((r) => [String(r.product_id), r]));

  return orders.map((order) => ({
    id: String(order._id),
    status: order.status ?? "placed",
    paymentMethod: order.payment_method ?? "",
    paymentStatus: order.payment_status ?? "",
    createdAt: new Date(order.created_at ?? Date.now()).toISOString(),
    subtotal: order.subtotal ?? 0,
    shipping: order.shipping ?? 0,
    tax: order.tax ?? 0,
    total: order.total ?? 0,
    fullName: order.full_name ?? "",
    email: order.email ?? "",
    phone: order.phone ?? "",
    address: [order.address1, order.address2, order.city, order.state, order.postal]
      .filter(Boolean)
      .join(", "),
    lines: items
      .filter((item) => String(item.order_id) === String(order._id))
      .map((item) => {
        const productId = item.product_id ?? "";
        const product = productById.get(productId);
        const review = reviewByProduct.get(productId);
        return {
          productId,
          slug: product?.slug ?? null,
          name: item.name ?? "Product",
          price: item.price ?? 0,
          quantity: item.quantity ?? 1,
          image: assetUrl(product?.thumbnail || product?.image),
          myRating: review?.rating ?? null,
          myComment: review?.comment ?? "",
        };
      }),
  }));
}

/** Orders that belong to one customer, newest first. */
export async function getOrdersForUser(userId: string): Promise<OrderView[]> {
  await connectDb();
  const orders = await Order.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(100)
    .lean<LeanOrder[]>();
  return hydrate(orders, userId);
}

/** One order, only if it belongs to this customer. */
export async function getOrderForUser(orderId: string, userId: string) {
  if (!isValidObjectId(orderId)) return null;
  await connectDb();
  const order = await Order.findOne({ _id: orderId, user_id: userId }).lean<LeanOrder>();
  if (!order) return null;
  const [view] = await hydrate([order], userId);
  return view;
}


/** Has this customer received an order containing this product? */
export async function hasDeliveredPurchase(userId: string, productId: string) {
  await connectDb();
  const delivered = await Order.find({ user_id: userId, status: "delivered" })
    .select("_id")
    .lean();
  if (delivered.length === 0) return false;
  const item = await OrderItem.exists({
    order_id: { $in: delivered.map((o) => o._id) },
    product_id: productId,
  });
  return Boolean(item);
}
