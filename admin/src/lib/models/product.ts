// Copy of web/src/lib/models/product.ts (same collection). Keep the two in sync.
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Mirrors the "products" collection created by the old Express server, so the
 * new site reads the existing data without any migration.
 *
 * autoIndex is off on purpose: the indexes already exist in the database and
 * this app should never change them just by connecting.
 */
const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: String,
    sku: String,
    category: { type: String, default: "" },
    brand: { type: String, default: "" },
    short_description: { type: String, default: "" },
    description: { type: String, default: "" },

    price: { type: Number, required: true },
    original_price: Number,
    discount: Number,

    stock: { type: Number, default: 0 },
    badge: String,

    material: { type: String, default: "" },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      unit: { type: String, default: "cm" },
    },
    color_variants: [String],
    weight: Number,

    thumbnail: { type: String, default: "" },
    gallery: [String],

    model_3d: {
      file_url: { type: String, default: "" },
      preview_thumbnail: { type: String, default: "" },
      enabled: { type: Boolean, default: false },
      format: { type: String, default: "" },
    },

    is_featured: { type: Boolean, default: false },
    is_trending: { type: Boolean, default: false },
    is_new_arrival: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },

    rating: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },

    seo: {
      meta_title: { type: String, default: "" },
      meta_description: { type: String, default: "" },
      meta_keywords: [String],
    },

    // Legacy fields the old site reads; kept in sync when a product is saved.
    image: String,
    model_src: String,
    is_3d: { type: Boolean, default: false },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "products", autoIndex: false },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc> | undefined) ??
  mongoose.model<ProductDoc>("Product", productSchema);
