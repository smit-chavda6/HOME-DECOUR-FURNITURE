import "server-only";
import mongoose from "mongoose";

/**
 * One shared MongoDB connection (the same database as the shop).
 * The promise lives on globalThis so hot reloads and serverless re-runs reuse it.
 */
const globalForDb = globalThis as unknown as {
  mongoosePromise?: Promise<typeof mongoose>;
};

export function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to admin/.env.local.");
  }

  if (!globalForDb.mongoosePromise) {
    globalForDb.mongoosePromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10_000 })
      .catch((error) => {
        globalForDb.mongoosePromise = undefined;
        throw error;
      });
  }

  return globalForDb.mongoosePromise;
}
