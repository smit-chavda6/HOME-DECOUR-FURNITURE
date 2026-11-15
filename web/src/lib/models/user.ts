import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Mirrors the "users" collection from the old site. Passwords are bcrypt hashes. */
const userSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    address_line1: { type: String, default: "" },
    address_line2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" },
    postal_code: { type: String, default: "" },
    role: { type: String, default: "user", enum: ["user", "admin"] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "users", autoIndex: false },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc> | undefined) ??
  mongoose.model<UserDoc>("User", userSchema);
