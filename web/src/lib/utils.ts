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

/**
 * Product images are stored in MongoDB as paths relative to the old site's
 * public folder (for example "image/product/Name%E2%84%A2.webp"). The same
 * folders exist in this app's public directory, so we only normalise the
 * encoding and add the leading slash.
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
  return "/" + encodeURI(decoded.replace(/^\/+/, ""));
}
