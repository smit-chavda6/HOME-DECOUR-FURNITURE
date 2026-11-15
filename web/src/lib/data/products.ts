import { cacheLife, cacheTag } from "next/cache";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { Product } from "@/lib/models/product";
import type { SortValue } from "@/lib/sort-options";
import { assetUrl } from "@/lib/utils";

/**
 * Every catalogue read goes through this file. Results are cached for hours
 * and tagged "products"; the admin panel (admin/) calls /api/revalidate after a
 * change so shoppers see it straight away.
 */

/** The small, serialisable product shape that cards and the cart use. */
export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  image: string | null;
  rating: number;
  ratingCount: number;
  has3d: boolean;
  inStock: boolean;
};

/** Everything the product page shows. */
export type ProductDetail = ProductSummary & {
  sku: string;
  brand: string;
  shortDescription: string;
  description: string;
  material: string;
  dimensions: { length: number; width: number; height: number; unit: string } | null;
  colors: string[];
  gallery: string[];
  modelUrl: string | null;
  stock: number;
  seoTitle: string;
  seoDescription: string;
};

export type ProductFilters = {
  category?: string;
  q?: string;
  sort?: SortValue;
  minPrice?: number;
  maxPrice?: number;
  only3d?: boolean;
  page?: number;
  pageSize?: number;
};

const SUMMARY_FIELDS =
  "name slug category price original_price badge thumbnail image rating rating_count stock model_3d.enabled model_3d.file_url";

const ACTIVE = { is_active: { $ne: false } };

type LeanProduct = {
  _id: unknown;
  name: string;
  slug?: string | null;
  sku?: string | null;
  category?: string | null;
  brand?: string | null;
  short_description?: string | null;
  description?: string | null;
  price: number;
  original_price?: number | null;
  badge?: string | null;
  material?: string | null;
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    unit?: string | null;
  } | null;
  color_variants?: string[] | null;
  thumbnail?: string | null;
  image?: string | null;
  gallery?: string[] | null;
  rating?: number | null;
  rating_count?: number | null;
  stock?: number | null;
  model_3d?: { enabled?: boolean | null; file_url?: string | null } | null;
  seo?: { meta_title?: string | null; meta_description?: string | null } | null;
};

function toSummary(doc: LeanProduct): ProductSummary {
  const id = String(doc._id);
  const originalPrice =
    doc.original_price && doc.original_price > doc.price
      ? doc.original_price
      : null;

  return {
    id,
    slug: doc.slug || id,
    name: doc.name,
    category: doc.category ?? "",
    price: doc.price,
    originalPrice,
    badge: doc.badge || null,
    image: assetUrl(doc.thumbnail || doc.image),
    rating: doc.rating ?? 0,
    ratingCount: doc.rating_count ?? 0,
    has3d: Boolean(doc.model_3d?.enabled && doc.model_3d?.file_url),
    inStock: (doc.stock ?? 0) > 0,
  };
}

function toDetail(doc: LeanProduct): ProductDetail {
  const summary = toSummary(doc);
  const d = doc.dimensions;
  const hasDimensions = Boolean(d && (d.length || d.width || d.height));

  // Main image first, then the rest of the gallery without duplicates.
  const gallery = [doc.thumbnail || doc.image, ...(doc.gallery ?? [])]
    .map((path) => assetUrl(path))
    .filter((url): url is string => Boolean(url));

  return {
    ...summary,
    sku: doc.sku ?? "",
    brand: doc.brand ?? "",
    shortDescription: doc.short_description ?? "",
    description: doc.description ?? "",
    material: doc.material ?? "",
    dimensions: hasDimensions
      ? {
          length: d?.length ?? 0,
          width: d?.width ?? 0,
          height: d?.height ?? 0,
          unit: d?.unit || "cm",
        }
      : null,
    colors: (doc.color_variants ?? []).filter(Boolean),
    gallery: [...new Set(gallery)],
    modelUrl: summary.has3d ? assetUrl(doc.model_3d?.file_url) : null,
    stock: doc.stock ?? 0,
    seoTitle: doc.seo?.meta_title ?? "",
    seoDescription: doc.seo?.meta_description ?? "",
  };
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SORTS: Record<SortValue, Record<string, 1 | -1>> = {
  featured: { is_featured: -1, rating: -1, _id: 1 },
  newest: { created_at: -1, _id: 1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: 1 },
  rating: { rating: -1, rating_count: -1, _id: 1 },
};

/** Shop listing with filters, sorting and paging. */
export async function listProducts(filters: ProductFilters = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const pageSize = Math.min(Math.max(filters.pageSize ?? 12, 1), 48);
  const page = Math.max(filters.page ?? 1, 1);

  const query: Record<string, unknown> = { ...ACTIVE };
  if (filters.category) query.category = filters.category;
  if (filters.only3d) query["model_3d.enabled"] = true;
  if (filters.minPrice != null || filters.maxPrice != null) {
    query.price = {
      ...(filters.minPrice != null ? { $gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { $lte: filters.maxPrice } : {}),
    };
  }
  const q = filters.q?.trim().slice(0, 60);
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    query.$or = [
      { name: pattern },
      { category: pattern },
      { material: pattern },
      { short_description: pattern },
    ];
  }

  await connectDb();
  const [docs, total] = await Promise.all([
    Product.find(query)
      .sort(SORTS[filters.sort ?? "featured"] ?? SORTS.featured)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select(SUMMARY_FIELDS)
      .lean<LeanProduct[]>(),
    Product.countDocuments(query),
  ]);

  return {
    products: docs.map(toSummary),
    total,
    page,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
  };
}

/** Featured products for the home page. */
export async function getFeaturedProducts(limit = 6): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const docs = await Product.find({ ...ACTIVE, is_featured: true })
    .sort({ created_at: -1, _id: 1 })
    .limit(limit)
    .select(SUMMARY_FIELDS)
    .lean<LeanProduct[]>();

  return docs.map(toSummary);
}

/** New arrivals for the home page carousel. */
export async function getNewArrivals(limit = 10): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const docs = await Product.find({ ...ACTIVE, is_new_arrival: true })
    .sort({ created_at: -1, _id: -1 })
    .limit(limit)
    .select(SUMMARY_FIELDS)
    .lean<LeanProduct[]>();

  return docs.map(toSummary);
}

/** Products that have a 3D model, for the AR page. */
export async function get3dProducts(): Promise<ProductDetail[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const docs = await Product.find({
    ...ACTIVE,
    "model_3d.enabled": true,
    "model_3d.file_url": { $nin: ["", null] },
  })
    .sort({ name: 1 })
    .lean<LeanProduct[]>();

  return docs.map(toDetail);
}

/** One product by its URL slug (or by id, which old links used). */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const doc = await Product.findOne({
    ...ACTIVE,
    $or: [{ slug }, ...(isValidObjectId(slug) ? [{ _id: slug }] : [])],
  }).lean<LeanProduct>();

  return doc ? toDetail(doc) : null;
}

/** Other products from the same category, for "You may also like". */
export async function getRelatedProducts(
  category: string,
  excludeId: string,
  limit = 4,
): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const docs = await Product.find({
    ...ACTIVE,
    category,
    _id: { $ne: excludeId },
  })
    .sort({ rating: -1, _id: 1 })
    .limit(limit)
    .select(SUMMARY_FIELDS)
    .lean<LeanProduct[]>();

  return docs.map(toSummary);
}

/** All product slugs, for prerendering product pages and the sitemap. */
export async function getAllProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const docs = await Product.find(ACTIVE).select("slug").lean();
  return docs.map((d) => d.slug || String(d._id));
}

/** How many active products each category has, e.g. { sofa: 12, chair: 11 }. */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const rows = await Product.aggregate<{ _id: string; count: number }>([
    { $match: ACTIVE },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

/** Headline numbers for the home page: pieces, 3D models, reviews, average rating. */
export async function getStoreStats() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const [row] = await Product.aggregate<{
    pieces: number;
    models: number;
    reviews: number;
    weighted: number;
  }>([
    { $match: ACTIVE },
    {
      $group: {
        _id: null,
        pieces: { $sum: 1 },
        models: { $sum: { $cond: [{ $eq: ["$model_3d.enabled", true] }, 1, 0] } },
        reviews: { $sum: { $ifNull: ["$rating_count", 0] } },
        weighted: { $sum: { $multiply: [{ $ifNull: ["$rating", 0] }, { $ifNull: ["$rating_count", 0] }] } },
      },
    },
  ]);

  return {
    pieces: row?.pieces ?? 0,
    models: row?.models ?? 0,
    reviews: row?.reviews ?? 0,
    rating: row && row.reviews > 0 ? Math.round((row.weighted / row.reviews) * 10) / 10 : 0,
  };
}

/** Lowest and highest price in the catalogue, for the price filter. */
export async function getPriceRange(): Promise<{ min: number; max: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const [row] = await Product.aggregate<{ min: number; max: number }>([
    { $match: ACTIVE },
    { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
  ]);
  return { min: row?.min ?? 0, max: row?.max ?? 0 };
}

/**
 * A compact catalogue for the AI features (chat and room advisor).
 * Small enough to send to the model in one prompt.
 */
export type CatalogueEntry = {
  slug: string;
  name: string;
  category: string;
  price: number;
  material: string;
  colors: string[];
  size: string;
  rating: number;
  inStock: boolean;
  has3d: boolean;
};

export async function getCatalogue(): Promise<CatalogueEntry[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  await connectDb();
  const docs = await Product.find(ACTIVE).sort({ name: 1 }).lean<LeanProduct[]>();
  return docs.map((doc) => {
    const p = toDetail(doc);
    return {
      slug: p.slug,
      name: p.name,
      category: p.category,
      price: p.price,
      material: p.material,
      colors: p.colors,
      size: p.dimensions
        ? `${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height} ${p.dimensions.unit}`
        : "",
      rating: p.rating,
      inStock: p.inStock,
      has3d: p.has3d,
    };
  });
}

/** Summaries for a list of slugs, in the same order (unknown slugs are skipped). */
export async function getProductsBySlugs(slugs: string[]): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  if (slugs.length === 0) return [];
  await connectDb();
  const docs = await Product.find({ ...ACTIVE, slug: { $in: slugs } })
    .select(SUMMARY_FIELDS)
    .lean<LeanProduct[]>();
  const bySlug = new Map(docs.map((d) => [d.slug, toSummary(d)]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((p): p is ProductSummary => Boolean(p));
}
