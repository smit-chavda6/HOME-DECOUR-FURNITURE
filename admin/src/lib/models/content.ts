// Same file in web/src/lib/models/content.ts (same collections). Keep the two in sync.
import mongoose, { Schema, type Model } from "mongoose";

/**
 * Website content edited in the admin panel.
 *
 * "sitecontent" holds one document per block, keyed by name:
 *   settings, home, banner, faq
 * Each stores its fields under `data`; the exact shape of each block is in
 * content-types.ts.
 */
export type SiteContentDoc = {
  _id: string;
  data: Record<string, unknown>;
  updated_at?: Date;
  updated_by?: string;
};

const siteContentSchema = new Schema<SiteContentDoc>(
  {
    _id: String,
    data: { type: Schema.Types.Mixed, default: {} },
    updated_at: { type: Date, default: Date.now },
    updated_by: String,
  },
  { collection: "sitecontent", minimize: false },
);

export const SiteContent: Model<SiteContentDoc> =
  (mongoose.models.SiteContent as Model<SiteContentDoc> | undefined) ??
  mongoose.model<SiteContentDoc>("SiteContent", siteContentSchema);

/**
 * Blog posts. `body` is plain text: paragraphs separated by a blank line,
 * and a line starting with "## " is a heading.
 */
export type PostDoc = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  body: string;
  status: "draft" | "published";
  published_at: Date;
  created_at?: Date;
  updated_at?: Date;
};

const postSchema = new Schema<PostDoc>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    image: { type: String, default: "" },
    body: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    published_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "posts" },
);

export const Post: Model<PostDoc> =
  (mongoose.models.Post as Model<PostDoc> | undefined) ??
  mongoose.model<PostDoc>("Post", postSchema);
