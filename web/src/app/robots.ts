import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/api/", "/login", "/register", "/wishlist"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
