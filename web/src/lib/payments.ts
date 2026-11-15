import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay (UPI, cards, net banking, wallets).
 *
 * Online payment switches on only when both keys are set in the environment:
 *   RAZORPAY_KEY_ID      (public, starts with rzp_test_ or rzp_live_)
 *   RAZORPAY_KEY_SECRET  (private, server only)
 * Without them the checkout offers cash on delivery only.
 */
export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || null;
}

export function isRazorpayEnabled() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Ask Razorpay to open a payment for this amount. Returns Razorpay's order id. */
export async function createRazorpayOrder(amountRupees: number, receipt: string) {
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
  ).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100), // Razorpay works in paise
      currency: "INR",
      receipt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Razorpay order failed with status ${response.status}`);
  }
  const data = (await response.json()) as { id: string };
  return data.id;
}

/**
 * Check that a "payment succeeded" message really came from Razorpay.
 * Razorpay signs "<order id>|<payment id>" with our secret; we compute the
 * same signature and compare. Without the secret nobody can fake it.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
) {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
