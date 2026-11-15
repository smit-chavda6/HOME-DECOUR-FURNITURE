import path from "node:path";
import type { NextConfig } from "next";

/**
 * Browser protections for every response. The Content-Security-Policy header
 * is added per request in src/proxy.ts because it carries a fresh nonce.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Admin pages are private: never let a browser or proxy keep a copy.
      { source: "/((?!_next/static).*)", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  turbopack: {
    // The repo root has its own package-lock.json (old site), so pin the root.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
