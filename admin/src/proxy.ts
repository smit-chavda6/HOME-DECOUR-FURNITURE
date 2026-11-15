import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/cookie-name";

/**
 * Runs before every page:
 * 1. Sends visitors without an admin cookie to /login. This is only a quick
 *    first filter; every page and action still verifies the session against
 *    the database (see lib/auth.ts).
 * 2. Adds a strict Content-Security-Policy with a fresh nonce, so only this
 *    app's own scripts can run.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = request.cookies.has(ADMIN_COOKIE);

  if (!hasCookie && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const shop = process.env.NEXT_PUBLIC_SHOP_URL ?? "";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // React renders some style attributes; styles cannot run code.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${shop} https://*.public.blob.vercel-storage.com`,
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
