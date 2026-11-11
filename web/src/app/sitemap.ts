import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/content";
import { getAllProductSlugs } from "@/lib/data/products";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages = ["", "/shop", "/ar", "/about", "/contact", "/faq", "/blog", "/privacy", "/terms"];
  const slugs = await getAllProductSlugs().catch(() => []);

  return [
    ...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...slugs.map((slug) => ({ url: `${base}/shop/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...blogPosts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.date, priority: 0.5 })),
  ];
}
