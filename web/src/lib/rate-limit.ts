import "server-only";
import mongoose, { Schema, type Model } from "mongoose";
import { headers } from "next/headers";
import { connectDb } from "@/lib/db";

/**
 * Rate limiting that works on serverless hosting.
 *
 * Counters live in MongoDB (collection "ratelimits") because in-memory
 * counters reset whenever a serverless function restarts. Each document is one
 * time window for one key, and a TTL index removes it after the window ends.
 */
type RateLimitDoc = { _id: string; count: number; expiresAt: Date };

const rateLimitSchema = new Schema<RateLimitDoc>(
  {
    _id: String,
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { collection: "ratelimits" },
);

const RateLimit: Model<RateLimitDoc> =
  (mongoose.models.RateLimit as Model<RateLimitDoc> | undefined) ??
  mongoose.model<RateLimitDoc>("RateLimit", rateLimitSchema);

export async function clientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Count one attempt for `key`. Returns false once more than `limit` attempts
 * were made inside the current window.
 *
 *   if (!(await rateLimit(`login:${ip}`, 10, 15 * 60))) { ...too many attempts }
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  await connectDb();
  const windowMs = windowSeconds * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const doc = await RateLimit.findOneAndUpdate(
    { _id: `${key}:${bucket}` },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs) },
    },
    { upsert: true, returnDocument: "after" },
  ).lean();

  return (doc?.count ?? 1) <= limit;
}
