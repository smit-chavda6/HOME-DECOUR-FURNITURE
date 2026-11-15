import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * Called by the separate admin panel after it changes something, so the shop
 * drops its cached copy right away.
 *
 * Only accepted when signed with REVALIDATE_SECRET (shared by both apps):
 *   x-hdf-timestamp: milliseconds since 1970
 *   x-hdf-signature: hex HMAC-SHA256 of "<timestamp>.<raw body>"
 * Requests older than five minutes are refused, so a captured request cannot
 * be replayed later. Only known cache tags can be refreshed.
 */

const MAX_AGE_MS = 5 * 60 * 1000;
const ALLOWED = /^(products|content|posts|reviews:[a-f0-9]{24})$/;

function deny(status = 401) {
  return Response.json({ ok: false }, { status });
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || secret.length < 32) return deny(503);

  const timestamp = request.headers.get("x-hdf-timestamp") ?? "";
  const signature = request.headers.get("x-hdf-signature") ?? "";
  const body = await request.text();
  if (body.length > 4096) return deny(413);

  const age = Math.abs(Date.now() - Number(timestamp));
  if (!/^\d{13}$/.test(timestamp) || !(age <= MAX_AGE_MS)) return deny();

  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest();
  const given = Buffer.from(signature, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return deny();

  let tags: unknown;
  try {
    tags = (JSON.parse(body) as { tags?: unknown }).tags;
  } catch {
    return deny(400);
  }
  if (!Array.isArray(tags) || tags.length === 0 || tags.length > 10) return deny(400);

  const valid = tags.filter((t): t is string => typeof t === "string" && ALLOWED.test(t));
  for (const tag of valid) revalidateTag(tag, { expire: 0 });

  return Response.json({ ok: true, revalidated: valid });
}
