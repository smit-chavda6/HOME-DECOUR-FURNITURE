import { cacheLife, cacheTag } from "next/cache";
import { connectDb } from "@/lib/db";
import { blogPosts as builtInPosts, faqGroups as builtInFaq } from "@/lib/content";
import { Post, SiteContent } from "@/lib/models/content";
import { site } from "@/lib/site";

/**
 * Website content edited in the separate admin panel (admin/).
 *
 * Reads are cached for hours and tagged "content" (settings, home, banner,
 * FAQ) or "posts" (blog). The admin panel calls /api/revalidate after a save
 * so changes show up straight away.
 *
 * Every reader falls back to the built-in text in lib/site.ts and
 * lib/content.ts when the database has nothing (or cannot be reached), so the
 * site never shows empty sections.
 */

export type StoreSettings = {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  hours: string;
  instagram: string;
  facebook: string;
  youtube: string;
  pinterest: string;
};

export type HomeContent = {
  eyebrow: string;
  line1: string;
  line2: string;
  line3: string;
  sentence: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export type Banner = {
  enabled: boolean;
  text: string;
  linkLabel: string;
  href: string;
  startsAt: string;
  endsAt: string;
};

export type FaqGroup = { title: string; items: { q: string; a: string }[] };

export type BlogBlock = { type: "heading" | "paragraph"; text: string };

export type BlogPostView = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // YYYY-MM-DD
  readingMinutes: number;
  image: string;
  blocks: BlogBlock[];
};

export const defaultSettings: StoreSettings = {
  name: site.name,
  tagline: site.tagline,
  description: site.description,
  phone: site.contact.phone,
  email: site.contact.email,
  address: site.contact.address,
  whatsapp: "",
  hours: "",
  instagram: "",
  facebook: "",
  youtube: "",
  pinterest: "",
};

export const defaultHome: HomeContent = {
  eyebrow: "Home Decor Furniture · Since 2014",
  line1: "Furniture for",
  line2: "the room",
  line3: "you live in",
  sentence:
    "Considered pieces in honest materials. Place any of them in your own room with your phone, and buy only when it fits.",
  primaryLabel: "Explore the collection",
  primaryHref: "/shop",
  secondaryLabel: "Try it in your room",
  secondaryHref: "/ar/live",
};

const defaultBanner: Banner = { enabled: false, text: "", linkLabel: "", href: "", startsAt: "", endsAt: "" };

/** Keep only string fields we know, so odd data in the database cannot break a page. */
function merge<T extends Record<string, unknown>>(defaults: T, stored: unknown): T {
  const out = { ...defaults };
  if (stored && typeof stored === "object") {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = (stored as Record<string, unknown>)[key as string];
      if (typeof value === typeof defaults[key]) {
        out[key] = value as T[keyof T];
      }
    }
  }
  return out;
}

async function readBlock(key: string): Promise<Record<string, unknown> | null> {
  try {
    await connectDb();
    const doc = await SiteContent.findById(key).lean();
    return (doc?.data as Record<string, unknown> | undefined) ?? null;
  } catch (error) {
    console.error(`[content] could not read "${key}"; using built-in text`, error);
    return null;
  }
}

export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const stored = merge(defaultSettings, await readBlock("settings"));
  // A store always needs a name.
  return { ...stored, name: stored.name || defaultSettings.name };
}

export async function getHomeContent(): Promise<HomeContent> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const stored = merge(defaultHome, await readBlock("home"));
  return {
    ...stored,
    line1: stored.line1 || defaultHome.line1,
    line2: stored.line2 || defaultHome.line2,
    line3: stored.line3 || defaultHome.line3,
    primaryLabel: stored.primaryLabel || defaultHome.primaryLabel,
    primaryHref: stored.primaryHref || defaultHome.primaryHref,
  };
}

/** The announcement bar. Whether today is inside its dates is decided in the browser. */
export async function getBanner(): Promise<Banner> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  return merge(defaultBanner, await readBlock("banner"));
}

export async function getFaq(): Promise<FaqGroup[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const stored = await readBlock("faq");
  const groups = Array.isArray(stored?.groups) ? (stored.groups as FaqGroup[]) : null;
  const clean = groups
    ?.map((g) => ({
      title: String(g?.title ?? ""),
      items: (Array.isArray(g?.items) ? g.items : [])
        .map((i) => ({ q: String(i?.q ?? ""), a: String(i?.a ?? "") }))
        .filter((i) => i.q && i.a),
    }))
    .filter((g) => g.title && g.items.length > 0);
  return clean && clean.length > 0 ? clean : builtInFaq;
}

/** Plain-text body -> blocks: blank lines split paragraphs, "## " starts a heading. */
export function parseBody(body: string): BlogBlock[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) =>
      chunk.startsWith("## ")
        ? { type: "heading" as const, text: chunk.slice(3).trim() }
        : { type: "paragraph" as const, text: chunk },
    );
}

function readingMinutes(text: string) {
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
}

const fallbackPosts: BlogPostView[] = builtInPosts.map((p) => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  date: p.date,
  readingMinutes: p.readingMinutes,
  image: p.image,
  blocks: p.body.flatMap((b) => [
    ...(b.heading ? [{ type: "heading" as const, text: b.heading }] : []),
    { type: "paragraph" as const, text: b.text },
  ]),
}));

/** Published posts, newest first. Uses the built-in articles until any post exists in the database. */
export async function getPosts(): Promise<BlogPostView[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  try {
    await connectDb();
    if ((await Post.estimatedDocumentCount()) === 0) return fallbackPosts;
    const docs = await Post.find({ status: "published", published_at: { $lte: new Date() } })
      .sort({ published_at: -1 })
      .limit(200)
      .lean();
    return docs.map((d) => ({
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt ?? "",
      date: new Date(d.published_at ?? Date.now()).toISOString().slice(0, 10),
      readingMinutes: readingMinutes(d.body ?? ""),
      image: d.image || "image/rooms/living.svg",
      blocks: parseBody(d.body ?? ""),
    }));
  } catch (error) {
    console.error("[content] could not read posts; using built-in articles", error);
    return fallbackPosts;
  }
}

export async function getPost(slug: string): Promise<BlogPostView | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}
