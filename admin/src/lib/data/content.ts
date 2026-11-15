import "server-only";
import { isValidObjectId } from "mongoose";
import { defaults, type Banner, type Faq, type HomeContent, type Settings } from "@/lib/content-types";
import { connectDb } from "@/lib/db";
import { Post, SiteContent } from "@/lib/models/content";

/** Website content for the editor pages. Never cached. */

type Blocks = { settings: Settings; home: HomeContent; banner: Banner; faq: Faq };

export async function getBlock<K extends keyof Blocks>(
  key: K,
): Promise<{ data: Blocks[K]; updatedAt: string | null; updatedBy: string }> {
  await connectDb();
  const doc = await SiteContent.findById(key).lean();
  const stored = (doc?.data ?? {}) as Partial<Blocks[K]>;
  return {
    data: { ...defaults[key], ...stored } as Blocks[K],
    updatedAt: doc?.updated_at ? new Date(doc.updated_at).toISOString() : null,
    updatedBy: doc?.updated_by ?? "",
  };
}

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  words: number;
  status: "draft" | "published";
  publishedAt: string;
  updatedAt: string;
};

export async function getPostRows(): Promise<PostRow[]> {
  await connectDb();
  const docs = await Post.find().sort({ published_at: -1 }).limit(500).lean();
  return docs.map((d) => ({
    id: String(d._id),
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt ?? "",
    image: d.image ?? "",
    words: (d.body ?? "").split(/s+/).filter(Boolean).length,
    status: d.status,
    publishedAt: new Date(d.published_at ?? Date.now()).toISOString(),
    updatedAt: new Date(d.updated_at ?? Date.now()).toISOString(),
  }));
}

export type PostFormValues = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  body: string;
  status: "draft" | "published";
  publishedAt: string; // YYYY-MM-DD
};

export async function getPostForEdit(id: string): Promise<PostFormValues | null> {
  if (!isValidObjectId(id)) return null;
  await connectDb();
  const d = await Post.findById(id).lean();
  if (!d) return null;
  return {
    id: String(d._id),
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt ?? "",
    image: d.image ?? "",
    body: d.body ?? "",
    status: d.status,
    publishedAt: new Date(d.published_at ?? Date.now()).toISOString().slice(0, 10),
  };
}
