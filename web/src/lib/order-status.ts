/**
 * Order lifecycle:
 *   pending_payment -> placed -> confirmed -> shipped -> delivered
 *                                         \-> cancelled
 * Cash-on-delivery orders start at "placed". Online orders start at
 * "pending_payment" and move to "placed" once Razorpay confirms the payment.
 *
 * Kept free of database imports so browser code can use it too.
 */
export const ORDER_STATUSES = [
  "pending_payment",
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusLabel: Record<string, string> = {
  pending_payment: "Awaiting payment",
  placed: "Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
