import type { MetadataRoute } from "next";

/** The admin panel must never appear in search engines. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
