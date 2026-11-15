"use client";

import { Heart } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import type { ProductSummary } from "@/lib/data/products";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/stores/wishlist";

type WishlistButtonProps = {
  product: ProductSummary;
  /** "icon" is the round button on cards; "full" is the labelled button on the product page. */
  variant?: "icon" | "full";
  className?: string;
};

export function WishlistButton({ product, variant = "icon", className }: WishlistButtonProps) {
  const hydrated = useHydrated();
  const saved = useWishlist((state) => state.items.some((i) => i.id === product.id));
  const toggle = useWishlist((state) => state.toggle);
  const active = hydrated && saved;

  if (variant === "full") {
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => toggle(product)}
        className={cn(
          "glass inline-flex h-13 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors hover:bg-ink/[0.07]",
          className,
        )}
      >
        <Heart className={cn("size-4 transition-transform", active && "scale-110 fill-accent text-accent")} aria-hidden />
        {active ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      onClick={() => toggle(product)}
      className={cn(
        "grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition-transform hover:scale-110",
        className,
      )}
    >
      <Heart className={cn("size-4.5", active && "fill-accent text-accent")} aria-hidden />
    </button>
  );
}
