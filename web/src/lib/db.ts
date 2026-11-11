import mongoose from "mongoose";

/**
 * One shared MongoDB connection.
 *
 * Serverless functions and dev hot-reloads re-run this module many times, so
 * the connection promise lives on globalThis and is reused instead of opening
 * a new connection on every request.
 */
const globalForDb = globalThis as unknown as {
  mongoosePromise?: Promise<typeof mongoose>;
};

export function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to web/.env.local.");
  }

  if (!globalForDb.mongoosePromise) {
    globalForDb.mongoosePromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10_000 })
      .catch((error) => {
        // Forget the failed attempt so the next request can retry.
        globalForDb.mongoosePromise = undefined;
        throw error;
      });
  }

  return globalForDb.mongoosePromise;
}
