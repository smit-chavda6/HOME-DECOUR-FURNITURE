"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductSummary } from "@/lib/data/products";

type WishlistState = {
  items: ProductSummary[];
  toggle: (product: ProductSummary) => void;
  remove: (id: string) => void;
};

/** Saved products, kept in this browser's localStorage. */
export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (product) =>
        set((state) => ({
          items: state.items.some((i) => i.id === product.id)
            ? state.items.filter((i) => i.id !== product.id)
            : [product, ...state.items].slice(0, 100),
        })),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
    }),
    { name: "hdf-wishlist" },
  ),
);
