// Copy of web/src/lib/models/review.ts (same collection). Keep the two in sync.
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const reviewSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true },
    username: { type: String, required: true },
    product_id: { type: Schema.Types.ObjectId, required: true },
    order_id: Schema.Types.ObjectId,
    rating: { type: Number, required: true, min: 0.5, max: 5 },
    comment: String,
    helpful_count: { type: Number, default: 0 },
    verified_purchase: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "reviews", autoIndex: false },
);

export type ReviewDoc = InferSchemaType<typeof reviewSchema>;

export const Review: Model<ReviewDoc> =
  (mongoose.models.Review as Model<ReviewDoc> | undefined) ??
  mongoose.model<ReviewDoc>("Review", reviewSchema);
