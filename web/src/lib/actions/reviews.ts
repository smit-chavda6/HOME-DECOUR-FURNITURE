"use server";

import { Types } from "mongoose";
import { updateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { hasDeliveredPurchase } from "@/lib/data/orders";
import { connectDb } from "@/lib/db";
import { Product } from "@/lib/models/product";
import { Review } from "@/lib/models/review";
import { fieldErrors, reviewSchema, type FormState } from "@/lib/validation";

/** Recalculate the average shown on product cards after reviews change. */
async function refreshProductRating(productId: string) {
  const [stats] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { product_id: new Types.ObjectId(productId) } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    {
      rating: stats ? Math.round(stats.average * 10) / 10 : 0,
      rating_count: stats?.count ?? 0,
    },
  );
  updateTag("products");
  updateTag(`reviews:${productId}`);
}

/**
 * Add or edit the signed-in customer's review of a product.
 * Only customers who received the product can review it, so every review on
 * the site is a verified purchase.
 */
export async function saveReviewAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please log in to write a review." };

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { errors, message: errors.rating ? "Choose a star rating." : undefined };
  }
  const { productId, rating, comment } = parsed.data;

  await connectDb();
  if (!(await Product.exists({ _id: productId }))) {
    return { message: "This product no longer exists." };
  }
  if (!(await hasDeliveredPurchase(user.id, productId))) {
    return { message: "You can review a product after it has been delivered to you." };
  }

  await Review.updateOne(
    { user_id: user.id, product_id: productId },
    {
      $set: {
        username: user.fullName || user.username,
        rating,
        comment,
        verified_purchase: true,
        updated_at: new Date(),
      },
      $setOnInsert: { created_at: new Date(), helpful_count: 0 },
    },
    { upsert: true },
  );

  await refreshProductRating(productId);
  return { ok: true, message: "Thank you. Your review is saved." };
}

export async function deleteReviewAction(productId: string): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please log in again." };
  if (!Types.ObjectId.isValid(productId)) return { message: "Unknown product." };

  await connectDb();
  await Review.deleteOne({ user_id: user.id, product_id: productId });
  await refreshProductRating(productId);
  return { ok: true, message: "Review removed." };
}
