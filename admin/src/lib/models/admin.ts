import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Admin accounts. Kept in their own "admins" collection, completely apart
 * from shop customers ("users"), so no customer account can ever become an
 * admin. Passwords are bcrypt hashes.
 *
 * token_version is copied into each login cookie. Raising it (password
 * change, "sign out everywhere", disabling the account) makes every existing
 * cookie for this admin stop working at once.
 */
const adminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: true },
    token_version: { type: Number, default: 0 },
    last_login_at: Date,
    last_login_ip: String,
    created_by: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "admins" },
);

export type AdminDoc = InferSchemaType<typeof adminSchema>;

export const Admin: Model<AdminDoc> =
  (mongoose.models.Admin as Model<AdminDoc> | undefined) ??
  mongoose.model<AdminDoc>("Admin", adminSchema);

/**
 * Activity log: logins (good and bad) and every change made in the panel.
 * Old entries expire after 180 days.
 */
const auditSchema = new Schema(
  {
    admin_id: String,
    username: String,
    action: { type: String, required: true },
    target: String,
    ip: String,
    at: { type: Date, default: Date.now, index: { expires: 60 * 60 * 24 * 180 } },
  },
  { collection: "adminaudit" },
);

export type AuditDoc = InferSchemaType<typeof auditSchema>;

export const Audit: Model<AuditDoc> =
  (mongoose.models.Audit as Model<AuditDoc> | undefined) ??
  mongoose.model<AuditDoc>("Audit", auditSchema);
