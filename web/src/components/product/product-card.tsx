import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Box, Star } from "lucide-react";
import type { ProductSummary } from "@/lib/data/products";
import { cn, formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";

type ProductCardProps = {
  product: ProductSummary;
  /** Passed to next/image so the browser downloads the right width. */
  sizes?: string;
  className?: string;
};

/** Glass product card. Its image morphs into the product page hero on navigation. */
export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw",
  className,
}: ProductCardProps) {
  const href = `/shop/${product.slug}`;
  const saving = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <article
      className={cn(
        "group ring-glow relative rounded-card bg-surface p-2 transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow)]",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radius-card)-0.4rem)] bg-surface-2">
        {product.image && (
          <ViewTransition name={`product-${product.id}`} share="morph" default="none">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes={sizes}
              className={cn(
                "object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]",
                !product.inStock && "opacity-50 grayscale",
              )}
            />
          </ViewTransition>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {!product.inStock ? (
            <span className="rounded-full bg-black/70 px-3 py-1 text-[0.7rem] font-semibold text-white backdrop-blur">
              Sold out
            </span>
          ) : (
            product.badge && (
              <span className="rounded-full bg-black/55 px-3 py-1 text-[0.7rem] font-semibold text-white backdrop-blur">
                {product.badge}
              </span>
            )
          )}
          {product.has3d && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[0.7rem] font-semibold text-accent-ink">
              <Box className="size-3" aria-hidden />
              3D · AR
            </span>
          )}
        </div>

        {/* These sit above the stretched link so they stay clickable. */}
        <div className="absolute top-3 right-3 z-10">
          <WishlistButton product={product} />
        </div>
        <div className="absolute right-3 bottom-3 z-10 translate-y-2 opacity-100 transition-all duration-500 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <AddToCartButton product={product} />
        </div>
      </div>

      <div className="px-2 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted uppercase">{product.category}</p>
          {product.ratingCount > 0 && (
            <p
              className="flex shrink-0 items-center gap-1 text-xs tabular-nums"
              aria-label={`Rated ${product.rating.toFixed(1)} out of 5`}
            >
              <Star className="size-3 fill-accent text-accent" aria-hidden />
              {product.rating.toFixed(1)}
            </p>
          )}
        </div>
        <h3 className="mt-1.5 text-[1.05rem] leading-snug font-medium tracking-tight">
          {/* The ::after pseudo-element stretches this link over the whole card. */}
          <Link href={href} className="after:absolute after:inset-0 after:rounded-card">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-muted line-through">{formatPrice(product.originalPrice)}</span>
              <span className="text-xs font-semibold text-sage">−{saving}%</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}

/** Placeholder shown while a grid of cards is loading. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="rounded-card bg-surface p-2">
      <div className="aspect-[4/5] animate-pulse rounded-[calc(var(--radius-card)-0.4rem)] bg-surface-2" />
      <div className="mx-2 mt-4 h-3 w-16 animate-pulse rounded bg-surface-2" />
      <div className="mx-2 mt-2 h-5 w-3/4 animate-pulse rounded bg-surface-2" />
      <div className="mx-2 mt-3 mb-2 h-4 w-24 animate-pulse rounded bg-surface-2" />
    </div>
  );
}
