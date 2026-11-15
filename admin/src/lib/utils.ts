import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names, letting later Tailwind classes win over earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 15800 -> "₹15,800" */
export function formatPrice(amount: number) {
  return inr.format(amount);
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function formatDate(iso: string | Date) {
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: string | Date) {
  return dateTimeFormat.format(new Date(iso));
}

/** Short, readable order number: the last 8 characters of the database id. */
export function orderNumber(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

/** Public address of the shop plus an optional path, without a trailing slash. */
export function shopUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SHOP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return base + path;
}

/**
 * Product images are stored as paths relative to the shop's public folder
 * (for example "image/product/Name.webp") or as full https URLs (uploads).
 * Relative paths only exist on the shop, so point them there.
 */
export function assetUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  let decoded = path;
  try {
    decoded = decodeURI(path);
  } catch {
    // Already-decoded paths containing a stray "%" land here; use as-is.
  }
  return shopUrl("/" + encodeURI(decoded.replace(/^\/+/, "")));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Timestamp (ms) for `days` days before now, for "last 7 days"-style counts on a page. */
export function daysAgo(days: number) {
  return Date.now() - days * 86_400_000;
}
