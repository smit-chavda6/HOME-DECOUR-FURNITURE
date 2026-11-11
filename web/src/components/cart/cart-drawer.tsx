"use client";

import Image from "next/image";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatPrice } from "@/lib/utils";
import { selectSubtotal, useCart } from "@/stores/cart";

/** Slide-in cart, mounted once in the root layout. */
export function CartDrawer() {
  const hydrated = useHydrated();
  const isOpen = useCart((state) => state.isOpen);
  const open = useCart((state) => state.open);
  const close = useCart((state) => state.close);
  const items = useCart((state) => state.items);
  const subtotal = useCart(selectSubtotal);
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);

  const visibleItems = hydrated ? items : [];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(next) => (next ? open() : close())}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-[min(26rem,100vw)] flex-col bg-surface shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <Dialog.Title className="font-display text-2xl font-semibold">
              Your cart
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close cart"
              className={buttonStyles({ variant: "ghost", size: "icon" })}
            >
              <X aria-hidden />
            </Dialog.Close>
          </div>

          {visibleItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-surface-2 text-muted">
                <ShoppingBag className="size-7" aria-hidden />
              </span>
              <p className="font-display text-xl">Your cart is empty</p>
              <p className="max-w-xs text-sm text-muted">
                Add a piece you like and it will wait here until you are ready.
              </p>
              <Link
                href="/shop"
                onClick={close}
                className={buttonStyles({ className: "mt-2" })}
              >
                Browse furniture
              </Link>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                {visibleItems.map((item) => (
                  <li key={item.id} className="flex gap-4 py-5">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/shop/${item.slug}`}
                        onClick={close}
                        className="truncate font-medium hover:text-accent"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatPrice(item.price)}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-full border border-line">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                            className="grid size-8 place-items-center rounded-full hover:bg-surface-2"
                          >
                            <Minus className="size-3.5" aria-hidden />
                          </button>
                          <span
                            className="w-7 text-center text-sm tabular-nums"
                            aria-label={`Quantity ${item.quantity}`}
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            className="grid size-8 place-items-center rounded-full hover:bg-surface-2"
                          >
                            <Plus className="size-3.5" aria-hidden />
                          </button>
                        </div>

                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => remove(item.id)}
                          className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-line px-6 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted">Subtotal</span>
                  <span className="font-display text-2xl font-semibold tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Shipping and taxes are calculated at checkout.
                </p>
                <Link
                  href="/checkout"
                  onClick={close}
                  className={buttonStyles({ size: "lg", className: "mt-4 w-full" })}
                >
                  Checkout
                </Link>
                <Button
                  variant="ghost"
                  onClick={close}
                  className="mt-2 w-full"
                >
                  Continue shopping
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
