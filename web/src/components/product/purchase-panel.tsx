"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/lib/data/products";
import { useCart } from "@/stores/cart";
import { WishlistButton } from "./wishlist-button";

/** Quantity picker with "Add to cart" and "Buy now" on the product page. */
export function PurchasePanel({ product, stock }: { product: ProductSummary; stock: number }) {
  const router = useRouter();
  const add = useCart((state) => state.add);
  const [quantity, setQuantity] = useState(1);
  const max = Math.min(stock, 10);

  const item = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
  };

  if (stock <= 0) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm font-medium">
          This piece is sold out right now.
        </p>
        <WishlistButton product={product} variant="full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 items-center rounded-full border border-line">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
            className="grid size-12 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-8 text-center font-medium tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= max}
            onClick={() => setQuantity((q) => Math.min(q + 1, max))}
            className="grid size-12 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        {stock <= 5 && (
          <p className="text-sm font-medium text-accent">Only {stock} left</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" className="min-w-48 flex-1" onClick={() => add(item, quantity)}>
          <ShoppingBag aria-hidden />
          Add to cart
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 border-ink/25"
          onClick={() => {
            add(item, quantity, false);
            router.push("/checkout");
          }}
        >
          Buy now
        </Button>
        <WishlistButton product={product} variant="full" />
      </div>
    </div>
  );
}
