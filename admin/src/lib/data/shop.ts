import "server-only";
import { isValidObjectId, type Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { ContactMessage } from "@/lib/models/contact-message";
import { Order, OrderItem } from "@/lib/models/order";
import { Product } from "@/lib/models/product";
import { Review } from "@/lib/models/review";
import { User } from "@/lib/models/user";
import { assetUrl } from "@/lib/utils";

/**
 * Shop data for the admin pages. Never cached, and only called from pages
 * that have already checked the visitor is a signed-in admin.
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

export type OrderView = {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  total: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  lines: { productId: string; name: string; price: number; quantity: number }[];
};

type LeanOrder = {
  _id: Types.ObjectId;
  status?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  created_at?: Date | null;
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

/** Orders, newest first, optionally filtered by status. */
export async function getOrders({ limit = 200, status }: { limit?: number; status?: string } = {}): Promise<OrderView[]> {
  await connectDb();
  const orders = await Order.find(status ? { status } : {})
    .sort({ created_at: -1 })
    .limit(limit)
    .lean<LeanOrder[]>();
  if (orders.length === 0) return [];

  const items = await OrderItem.find({ order_id: { $in: orders.map((o) => o._id) } }).lean();

  return orders.map((order) => ({
    id: String(order._id),
    status: order.status ?? "placed",
    paymentMethod: order.payment_method ?? "",
    paymentStatus: order.payment_status ?? "",
    createdAt: new Date(order.created_at ?? Date.now()).toISOString(),
    total: order.total ?? 0,
    fullName: order.full_name ?? "",
    email: order.email ?? "",
    phone: order.phone ?? "",
    address: [order.address1, order.address2, order.city, order.state, order.postal].filter(Boolean).join(", "),
    lines: items
      .filter((item) => String(item.order_id) === String(order._id))
      .map((item) => ({
        productId: item.product_id ?? "",
        name: item.name ?? "Product",
        price: item.price ?? 0,
        quantity: item.quantity ?? 1,
      })),
  }));
}

export type DayPoint = { date: string; revenue: number; orders: number; customers: number };

/**
 * One point per day (India time) for the last `days` days, oldest first:
 * revenue and orders (excluding cancelled and unpaid) and new customers.
 * Days with nothing are included as zeros so charts have a steady x-axis.
 */
export async function getDailySeries(days = 30): Promise<DayPoint[]> {
  await connectDb();
  const tz = "Asia/Kolkata";
  const key = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d); // YYYY-MM-DD
  const since = new Date(Date.now() - (days - 1) * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);
  since.setTime(since.getTime() - 86_400_000); // margin for the time-zone shift; trimmed below

  const [orders, users] = await Promise.all([
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { created_at: { $gte: since }, status: { $nin: ["cancelled", "pending_payment"] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at", timezone: tz } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
    ]),
    User.aggregate<{ _id: string; customers: number }>([
      { $match: { created_at: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at", timezone: tz } },
          customers: { $sum: 1 },
        },
      },
    ]),
  ]);

  const byDay = new Map(orders.map((o) => [o._id, o]));
  const usersByDay = new Map(users.map((u) => [u._id, u.customers]));
  return Array.from({ length: days }, (_, i) => {
    const date = key(new Date(Date.now() - (days - 1 - i) * 86_400_000));
    const o = byDay.get(date);
    return { date, revenue: o?.revenue ?? 0, orders: o?.orders ?? 0, customers: usersByDay.get(date) ?? 0 };
  });
}
