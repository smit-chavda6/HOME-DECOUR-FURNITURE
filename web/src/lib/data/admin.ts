import "server-only";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { ContactMessage } from "@/lib/models/contact-message";
import { Order } from "@/lib/models/order";
import { Product } from "@/lib/models/product";
import { Review } from "@/lib/models/review";
import { User } from "@/lib/models/user";
import { assetUrl } from "@/lib/utils";

/**
 * Admin reads. Never cached, and only called from pages that have already
 * checked the visitor is an admin.
 */

export async function getDashboardStats() {
  await connectDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [products, lowStock, users, messages, reviews, orderCount, revenue, recentRevenue, byStatus] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ is_active: { $ne: false }, stock: { $lte: 3 } }),
      User.countDocuments(),
      ContactMessage.countDocuments(),
      Review.countDocuments(),
      Order.countDocuments(),
      Order.aggregate<{ total: number }>([
        { $match: { status: { $nin: ["cancelled", "pending_payment"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate<{ total: number; count: number }>([
        { $match: { created_at: { $gte: since }, status: { $nin: ["cancelled", "pending_payment"] } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Order.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

  return {
    products,
    lowStock,
    users,
    messages,
    reviews,
    orders: orderCount,
    revenue: revenue[0]?.total ?? 0,
    revenue30d: recentRevenue[0]?.total ?? 0,
    orders30d: recentRevenue[0]?.count ?? 0,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id ?? "placed", s.count])) as Record<string, number>,
  };
}

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  featured: boolean;
  has3d: boolean;
  image: string | null;
};

export async function getAdminProducts(q?: string): Promise<AdminProductRow[]> {
  await connectDb();
  const filter = q
    ? { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }
    : {};
  const docs = await Product.find(filter)
    .sort({ created_at: -1, _id: -1 })
    .select("name slug category price stock is_active is_featured model_3d.enabled thumbnail image")
    .lean();

  return docs.map((d) => ({
    id: String(d._id),
    slug: d.slug || String(d._id),
    name: d.name,
    category: d.category ?? "",
    price: d.price,
    stock: d.stock ?? 0,
    active: d.is_active !== false,
    featured: Boolean(d.is_featured),
    has3d: Boolean(d.model_3d?.enabled),
    image: assetUrl(d.thumbnail || d.image),
  }));
}

/** Raw values for the product edit form. */
export async function getProductForEdit(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDb();
  const d = await Product.findById(id).lean();
  if (!d) return null;

  return {
    id: String(d._id),
    slug: d.slug ?? "",
    name: d.name,
    category: d.category ?? "",
    brand: d.brand ?? "",
    shortDescription: d.short_description ?? "",
    description: d.description ?? "",
    price: String(d.price ?? ""),
    originalPrice: d.original_price ? String(d.original_price) : "",
    stock: String(d.stock ?? 0),
    badge: d.badge ?? "",
    material: d.material ?? "",
    length: String(d.dimensions?.length ?? 0),
    width: String(d.dimensions?.width ?? 0),
    height: String(d.dimensions?.height ?? 0),
    colors: (d.color_variants ?? []).join(", "),
    thumbnail: d.thumbnail || d.image || "",
    gallery: (d.gallery ?? []).join("\n"),
    modelUrl: d.model_3d?.file_url ?? "",
    isFeatured: Boolean(d.is_featured),
    isTrending: Boolean(d.is_trending),
    isNewArrival: Boolean(d.is_new_arrival),
    isActive: d.is_active !== false,
  };
}

export type ProductFormValues = NonNullable<Awaited<ReturnType<typeof getProductForEdit>>>;

export async function getAdminUsers() {
  await connectDb();
  const [users, orderCounts] = await Promise.all([
    User.find().sort({ created_at: -1 }).select("-password").lean(),
    Order.aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: "$user_id", count: { $sum: 1 } } },
    ]),
  ]);
  const counts = new Map(orderCounts.map((o) => [String(o._id), o.count]));

  return users.map((u) => ({
    id: String(u._id),
    username: u.username,
    fullName: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role === "admin" ? "admin" : "user",
    orders: counts.get(String(u._id)) ?? 0,
    joined: new Date(u.created_at ?? Date.now()).toISOString(),
  }));
}

export async function getAdminMessages() {
  await connectDb();
  const docs = await ContactMessage.find().sort({ created_at: -1 }).limit(200).lean();
  return docs.map((m) => ({
    id: String(m._id),
    name: m.name ?? "",
    email: m.email ?? "",
    phone: m.phone ?? "",
    subject: m.subject ?? "",
    message: m.message ?? "",
    date: new Date(m.created_at ?? Date.now()).toISOString(),
  }));
}
