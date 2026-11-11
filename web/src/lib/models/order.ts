import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const orderSchema = new Schema(
  {
    user_id: Schema.Types.ObjectId,
    full_name: String,
    email: String,
    phone: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    country: String,
    postal: String,
    payment_method: String, // "cod" | "razorpay" (older orders: upi, card, crypto…)
    payment_status: { type: String, default: "pending" }, // pending | paid | failed
    razorpay_order_id: String,
    razorpay_payment_id: String,
    upi_id: String,
    card_last4: String,
    subtotal: Number,
    shipping: Number,
    tax: Number,
    total: Number,
    status: { type: String, default: "placed" },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "orders", autoIndex: false },
);

const orderItemSchema = new Schema(
  {
    order_id: Schema.Types.ObjectId,
    product_id: String,
    name: String,
    price: Number,
    quantity: Number,
  },
  { collection: "orderitems", autoIndex: false },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;
export type OrderItemDoc = InferSchemaType<typeof orderItemSchema>;

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc> | undefined) ??
  mongoose.model<OrderDoc>("Order", orderSchema);

export const OrderItem: Model<OrderItemDoc> =
  (mongoose.models.OrderItem as Model<OrderItemDoc> | undefined) ??
  mongoose.model<OrderItemDoc>("OrderItem", orderItemSchema);
