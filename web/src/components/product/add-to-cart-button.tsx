"use client";

import { Plus } from "lucide-react";
import type { ProductSummary } from "@/lib/data/products";
import { useCart } from "@/stores/cart";

/** Round quick-add button shown on product cards. */
export function AddToCartButton({ product }: { product: ProductSummary }) {
  const add = useCart((state) => state.add);

  return (
    <button
      type="button"
      disabled={!product.inStock}
      aria-label={`Add ${product.name} to cart`}
      onClick={() =>
        add({
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.image,
        })
      }
      className="grid size-11 place-items-center rounded-full bg-white text-black shadow-lg transition-all hover:scale-110 hover:bg-accent hover:text-accent-ink disabled:pointer-events-none disabled:opacity-50"
    >
      <Plus className="size-5" aria-hidden />
    </button>
  );
}
