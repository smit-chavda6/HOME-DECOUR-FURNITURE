import "server-only";
import { createHmac } from "node:crypto";
import { shopUrl } from "@/lib/utils";

/**
 * Tell the shop to drop cached data after a change, so the change shows up
 * right away. The shop's /api/revalidate route only accepts requests signed
 * with REVALIDATE_SECRET (HMAC-SHA256 over "timestamp.body") and less than
 * five minutes old.
 *
 * Tags used by the shop: "products", "content", "posts", "reviews:<id>".
 * Failure never breaks the admin action; the shop's caches also expire on
 * their own after a while.
 */
export async function refreshShop(...tags: string[]) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || secret.length < 32) {
    console.warn("[revalidate] REVALIDATE_SECRET is not set; the shop will update when its cache expires.");
    return false;
  }

  const body = JSON.stringify({ tags });
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

  try {
    const response = await fetch(shopUrl("/api/revalidate"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hdf-timestamp": timestamp,
        "x-hdf-signature": signature,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.warn(`[revalidate] shop answered ${response.status}`);
    return response.ok;
  } catch (error) {
    console.warn("[revalidate] could not reach the shop", error);
    return false;
  }
}
