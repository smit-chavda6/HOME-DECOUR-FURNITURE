import "server-only";
import mongoose, { Schema, type Model } from "mongoose";
import { headers } from "next/headers";
import { connectDb } from "@/lib/db";

/**
 * Rate limiting stored in MongoDB (collection "ratelimits", shared with the
 * shop), so it works on serverless hosting. Keys are prefixed "admin:".
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

function bucketId(key: string, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  return { id: `admin:${key}:${bucket}`, expiresAt: new Date((bucket + 1) * windowMs) };
}

/** True while fewer than `limit` attempts were counted in the current window (counts nothing). */
export async function underLimit(key: string, limit: number, windowSeconds: number) {
  await connectDb();
  const doc = await RateLimit.findById(bucketId(key, windowSeconds).id).lean();
  return (doc?.count ?? 0) < limit;
}

/** Count one attempt. Returns false once more than `limit` happened in the window. */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  await connectDb();
  const { id, expiresAt } = bucketId(key, windowSeconds);
  const doc = await RateLimit.findOneAndUpdate(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt },
    },
    { upsert: true, returnDocument: "after" },
  ).lean();

  return (doc?.count ?? 1) <= limit;
}
