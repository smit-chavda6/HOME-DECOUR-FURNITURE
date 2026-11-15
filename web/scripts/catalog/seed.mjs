/**
 * Replace the product catalogue with the demo catalogue in catalog.mjs.
 *
 *   node scripts/catalog/seed.mjs --reset
 *
 * --reset is required because this deletes every product, review, order and
 * order item first (they all point at products). Users, contact messages and
 * chat logs are left alone. Take a backup before running it on real data.
 *
 * Reads MONGODB_URI from the environment or web/.env.local.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { brand, products, slugify } from "./catalog.mjs";

if (!process.argv.includes("--reset")) {
  console.error("Refusing to run without --reset (this deletes all products, reviews and orders).");
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const uri =
  process.env.MONGODB_URI ??
  readFileSync(path.join(here, "..", "..", ".env.local"), "utf8").match(/^MONGODB_URI=(.*)$/m)?.[1]?.trim();
if (!uri) throw new Error("MONGODB_URI is not set.");

function toDoc(p, i) {
  const slug = slugify(p.name);
  const image = `image/catalog/${slug}.svg`;
  const model = p.model ? `3d models/${p.model}.glb` : "";
  const [length, width, height] = p.dims;
  const now = new Date(Date.now() - i * 36e5); // newest first, an hour apart
  return {
    name: p.name,
    slug,
    sku: `HDS-${p.category.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
    category: p.category,
    brand,
    short_description: p.short,
    description: p.desc,
    price: p.price,
    original_price: p.original ?? null,
    discount: p.original ? Math.round(((p.original - p.price) / p.original) * 100) : 0,
    stock: p.stock,
    badge: p.badge ?? null,
    material: p.material,
    dimensions: { length, width, height, unit: "cm" },
    color_variants: p.colors,
    weight: p.weight,
    thumbnail: image,
    gallery: [`image/catalog/${slug}-alt.svg`],
    model_3d: { file_url: model, preview_thumbnail: "", enabled: Boolean(model), format: model ? "glb" : "" },
    is_featured: Boolean(p.flags.featured),
    is_trending: Boolean(p.flags.trending),
    is_new_arrival: Boolean(p.flags.newArrival),
    is_active: true,
    rating: 0,
    rating_count: 0,
    seo: {
      meta_title: `${p.name} | ${brand}`,
      meta_description: p.short,
      meta_keywords: [p.category, ...p.name.toLowerCase().split(" ").filter((w) => w.length > 3)],
    },
    // Legacy fields read by the old Express site.
    image,
    model_src: model || null,
    is_3d: Boolean(model),
    created_at: now,
    updated_at: now,
  };
}

const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 15_000 }).asPromise();
const db = conn.getClient().db(conn.name);
try {
  const removed = {};
  for (const name of ["orderitems", "orders", "reviews", "products"]) {
    removed[name] = (await db.collection(name).deleteMany({})).deletedCount;
  }
  console.log(`Database "${conn.name}": removed`, removed);
  const docs = products.map(toDoc);
  const { insertedCount } = await db.collection("products").insertMany(docs);
  const by = docs.reduce((acc, d) => ((acc[d.category] = (acc[d.category] ?? 0) + 1), acc), {});
  console.log(`Inserted ${insertedCount} products`, by, `(${docs.filter((d) => d.is_3d).length} with 3D models)`);
} finally {
  await conn.close();
}
