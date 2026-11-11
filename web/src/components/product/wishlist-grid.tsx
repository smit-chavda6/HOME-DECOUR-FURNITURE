"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useWishlist } from "@/stores/wishlist";
import { ProductCard, ProductCardSkeleton } from "./product-card";

export function WishlistGrid() {
  const hydrated = useHydrated();
  const items = useWishlist((state) => state.items);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-panel bg-surface-2 px-6 py-20 text-center">
        <Heart className="size-10 text-muted" aria-hidden />
        <h2 className="mt-5 font-display text-2xl">Nothing saved yet</h2>
        <p className="mt-2 max-w-sm text-muted">Tap the heart on a piece you like and it will wait for you here.</p>
        <Link href="/shop" className={buttonStyles({ className: "mt-6" })}>
          Browse furniture
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} sizes="(min-width: 1024px) 22vw, 46vw" />
      ))}
    </div>
  );
}
