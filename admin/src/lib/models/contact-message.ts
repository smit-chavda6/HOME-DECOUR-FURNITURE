// Copy of web/src/lib/models/contact-message.ts (same collection). Keep the two in sync.
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const contactMessageSchema = new Schema(
  {
    // Set when the sender was signed in; guests can write too.
    user_id: Schema.Types.ObjectId,
    name: String,
    email: String,
    phone: String,
    subject: String,
    message: String,
    created_at: { type: Date, default: Date.now },
  },
  { collection: "contactmessages", autoIndex: false },
);

export type ContactMessageDoc = InferSchemaType<typeof contactMessageSchema>;

export const ContactMessage: Model<ContactMessageDoc> =
  (mongoose.models.ContactMessage as Model<ContactMessageDoc> | undefined) ??
  mongoose.model<ContactMessageDoc>("ContactMessage", contactMessageSchema);
