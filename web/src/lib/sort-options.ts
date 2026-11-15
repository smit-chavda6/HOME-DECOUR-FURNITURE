/** Kept in its own file so browser code can import it without pulling in database code. */
export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function isSortValue(value: unknown): value is SortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

/** Price bands offered in the shop filter. */
export const PRICE_BANDS = [
  { value: "under-15000", label: "Under ₹15,000", min: undefined, max: 14_999 },
  { value: "15000-30000", label: "₹15,000 to ₹30,000", min: 15_000, max: 30_000 },
  { value: "30000-50000", label: "₹30,000 to ₹50,000", min: 30_001, max: 50_000 },
  { value: "over-50000", label: "Over ₹50,000", min: 50_001, max: undefined },
] as const;
