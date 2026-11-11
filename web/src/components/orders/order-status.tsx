import { orderStatusLabel } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  pending_payment: "bg-amber-600/15 text-amber-800 dark:text-amber-300",
  placed: "bg-sky-600/15 text-sky-800 dark:text-sky-300",
  confirmed: "bg-indigo-600/15 text-indigo-800 dark:text-indigo-300",
  shipped: "bg-violet-600/15 text-violet-800 dark:text-violet-300",
  delivered: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300",
  cancelled: "bg-red-600/15 text-red-800 dark:text-red-300",
};

/** Coloured pill showing where an order is. */
export function OrderStatus({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        tone[status] ?? "bg-surface-2 text-ink",
      )}
    >
      {orderStatusLabel[status] ?? status}
    </span>
  );
}

const paymentLabels: Record<string, string> = {
  cod: "Cash on delivery",
  razorpay: "Paid online",
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
  crypto: "Crypto",
};

export function paymentLabel(method: string) {
  return paymentLabels[method] ?? (method || "—");
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

/** Short, readable order number: the last 8 characters of the database id. */
export function orderNumber(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}
