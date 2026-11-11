"use server";

import { isValidObjectId } from "mongoose";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { ContactMessage } from "@/lib/models/contact-message";
import { Order, OrderItem } from "@/lib/models/order";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";
import { Product } from "@/lib/models/product";
import { Review } from "@/lib/models/review";
import { User } from "@/lib/models/user";
import {
  fieldErrors,
  formValues,
  productSchema,
  type FormState,
} from "@/lib/validation";

/**
 * Every action here starts by checking the caller is an admin. Hiding the
 * admin pages is not enough: server actions can be called directly.
 */
async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Not allowed");
  }
  return user;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name) || "product";
  let slug = base;
  for (let n = 2; n < 50; n++) {
    const clash = await Product.exists({
      slug,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    });
    if (!clash) return slug;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function splitList(text: string) {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Create a product, or update it when the form carries an id. */
export async function saveProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertAdmin();
  const values = formValues(formData);

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields.", values };
  }
  const data = parsed.data;
  const id = String(formData.get("id") ?? "");
  const isEdit = isValidObjectId(id);

  const originalPrice =
    data.originalPrice !== "" && data.originalPrice > data.price
      ? data.originalPrice
      : undefined;
  const modelUrl = data.modelUrl;

  const fields = {
    name: data.name,
    category: data.category,
    brand: data.brand,
    short_description: data.shortDescription,
    description: data.description,
    price: data.price,
    original_price: originalPrice,
    discount: originalPrice
      ? Math.round(((originalPrice - data.price) / originalPrice) * 100)
      : 0,
    stock: data.stock,
    badge: data.badge,
    material: data.material,
    dimensions: {
      length: data.length,
      width: data.width,
      height: data.height,
      unit: "cm",
    },
    color_variants: splitList(data.colors),
    thumbnail: data.thumbnail,
    image: data.thumbnail,
    gallery: splitList(data.gallery),
    model_3d: {
      file_url: modelUrl,
      preview_thumbnail: data.thumbnail,
      enabled: Boolean(modelUrl),
      format: modelUrl.toLowerCase().endsWith(".gltf") ? "gltf" : modelUrl ? "glb" : "",
    },
    model_src: modelUrl,
    is_3d: Boolean(modelUrl),
    is_featured: formData.get("isFeatured") === "on",
    is_trending: formData.get("isTrending") === "on",
    is_new_arrival: formData.get("isNewArrival") === "on",
    is_active: formData.get("isActive") === "on",
    updated_at: new Date(),
  };

  await connectDb();
  if (isEdit) {
    const result = await Product.updateOne({ _id: id }, { $set: fields });
    if (result.matchedCount === 0) return { message: "This product no longer exists.", values };
  } else {
    const prefix = data.category.slice(0, 3).toUpperCase().padEnd(3, "X");
    await Product.create({
      ...fields,
      slug: await uniqueSlug(data.name),
      sku: `HDF-${prefix}-${Date.now().toString(36).toUpperCase()}`,
    });
  }

  updateTag("products");
  redirect("/admin/products");
}

export async function deleteProductAction(id: string): Promise<FormState> {
  await assertAdmin();
  if (!isValidObjectId(id)) return { message: "Unknown product." };

  await connectDb();
  await Product.deleteOne({ _id: id });
  await Review.deleteMany({ product_id: id });
  updateTag("products");
  updateTag(`reviews:${id}`);
  return { ok: true, message: "Product deleted." };
}

export async function setProductActiveAction(id: string, active: boolean): Promise<FormState> {
  await assertAdmin();
  if (!isValidObjectId(id)) return { message: "Unknown product." };

  await connectDb();
  await Product.updateOne({ _id: id }, { is_active: active, updated_at: new Date() });
  updateTag("products");
  return { ok: true };
}

/** Statuses whose stock has been taken out of inventory. */
const HOLDS_STOCK = new Set(["placed", "confirmed", "shipped"]);

export async function updateOrderStatusAction(id: string, status: string): Promise<FormState> {
  await assertAdmin();
  if (!isValidObjectId(id) || !ORDER_STATUSES.includes(status as OrderStatus)) {
    return { message: "Unknown order or status." };
  }

  await connectDb();
  const order = await Order.findById(id);
  if (!order) return { message: "This order no longer exists." };
  const previous = order.status ?? "placed";
  if (previous === status) return { ok: true };

  // Cancelling an order that was holding stock puts the items back on sale.
  if (status === "cancelled" && HOLDS_STOCK.has(previous)) {
    const items = await OrderItem.find({ order_id: order._id }).lean();
    await Promise.all(
      items
        .filter((item) => isValidObjectId(item.product_id))
        .map((item) =>
          Product.updateOne({ _id: item.product_id }, { $inc: { stock: item.quantity ?? 0 } }),
        ),
    );
    updateTag("products");
  }

  order.status = status;
  if (status === "delivered" && order.payment_method === "cod") {
    order.payment_status = "paid"; // cash was collected at the door
  }
  await order.save();
  return { ok: true, message: "Order updated." };
}

export async function setUserRoleAction(id: string, role: string): Promise<FormState> {
  const admin = await assertAdmin();
  if (!isValidObjectId(id) || (role !== "user" && role !== "admin")) {
    return { message: "Unknown user or role." };
  }
  if (id === admin.id) return { message: "You cannot change your own role." };

  await connectDb();
  await User.updateOne({ _id: id }, { role, updated_at: new Date() });
  return { ok: true, message: "Role updated." };
}

export async function deleteUserAction(id: string): Promise<FormState> {
  const admin = await assertAdmin();
  if (!isValidObjectId(id)) return { message: "Unknown user." };
  if (id === admin.id) return { message: "You cannot delete your own account." };

  await connectDb();
  await User.deleteOne({ _id: id });
  return { ok: true, message: "User deleted." };
}

export async function deleteMessageAction(id: string): Promise<FormState> {
  await assertAdmin();
  if (!isValidObjectId(id)) return { message: "Unknown message." };

  await connectDb();
  await ContactMessage.deleteOne({ _id: id });
  return { ok: true, message: "Message deleted." };
}
