/**
 * Order totals. Used by the cart and checkout screens for display and by the
 * server when an order is placed, so both always agree. Same rules as the old
 * site: 18% GST, Rs 499 standard shipping, free shipping from Rs 50,000.
 */
export const GST_RATE = 0.18;
export const SHIPPING_FEE = 499;
export const FREE_SHIPPING_FROM = 50_000;

export type Totals = {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

export function calculateTotals(
  lines: { price: number; quantity: number }[],
): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const tax = Math.round(subtotal * GST_RATE);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}
