"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useWishlist } from "@/stores/wishlist";

/** Header heart icon with the number of saved products. */
export function WishlistLink() {
  const hydrated = useHydrated();
  const count = useWishlist((state) => state.items.length);
  const shown = hydrated ? count : 0;

  return (
    <Link
      href="/wishlist"
      aria-label={shown > 0 ? `Wishlist, ${shown} saved` : "Wishlist"}
      className={buttonStyles({
        variant: "ghost",
        size: "icon",
        className: "relative hidden sm:inline-flex",
      })}
    >
      <Heart aria-hidden />
      {shown > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.6875rem] font-semibold text-bg">
          {shown}
        </span>
      )}
    </Link>
  );
}
