"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Add to the cart and open the drawer (pass openDrawer: false to stay put). */
  add: (
    item: Omit<CartItem, "quantity">,
    quantity?: number,
    openDrawer?: boolean,
  ) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const MAX_PER_ITEM = 10;

/**
 * Cart state, saved to localStorage so it survives a refresh.
 *
 * Prices stored here are only for display. At checkout the server must look
 * every product up again and calculate the total itself.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      add: (item, quantity = 1, openDrawer = true) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          const items = existing
            ? state.items.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      // Refresh name, price and image in case they changed.
                      ...item,
                      quantity: Math.min(i.quantity + quantity, MAX_PER_ITEM),
                    }
                  : i,
              )
            : [...state.items, { ...item, quantity: Math.min(quantity, MAX_PER_ITEM) }];
          return { items, isOpen: openDrawer ? true : state.isOpen };
        }),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id
                    ? { ...i, quantity: Math.min(quantity, MAX_PER_ITEM) }
                    : i,
                ),
        })),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "hdf-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
