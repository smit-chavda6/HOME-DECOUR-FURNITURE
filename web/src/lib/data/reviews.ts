import { cacheLife, cacheTag } from "next/cache";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { Review } from "@/lib/models/review";

export type ReviewItem = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  verified: boolean;
  date: string; // ISO string
};

export type ReviewSummary = {
  reviews: ReviewItem[];
  average: number;
  count: number;
  /** How many reviews gave 5, 4, 3, 2 and 1 stars (rounded up). */
  breakdown: { stars: number; count: number }[];
};

/** Reviews for one product, newest first. Cached until someone reviews it. */
export async function getProductReviews(productId: string): Promise<ReviewSummary> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews", `reviews:${productId}`);

  const empty: ReviewSummary = {
    reviews: [],
    average: 0,
    count: 0,
    breakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 })),
  };
  if (!isValidObjectId(productId)) return empty;

  await connectDb();
  const docs = await Review.find({ product_id: productId })
    .sort({ created_at: -1 })
    .limit(100)
    .lean();
  if (docs.length === 0) return empty;

  const reviews: ReviewItem[] = docs.map((doc) => ({
    id: String(doc._id),
    author: doc.username,
    rating: doc.rating,
    comment: doc.comment ?? "",
    verified: Boolean(doc.verified_purchase),
    date: new Date(doc.created_at ?? Date.now()).toISOString(),
  }));

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    reviews,
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
    breakdown: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((r) => Math.ceil(r.rating) === stars).length,
    })),
  };
}
