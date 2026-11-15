"use client";

import { ShoppingBag } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { selectCount, useCart } from "@/stores/cart";

/** Header bag icon with the live item count. Opens the cart drawer. */
export function CartButton() {
  const hydrated = useHydrated();
  const count = useCart(selectCount);
  const open = useCart((state) => state.open);
  const shown = hydrated ? count : 0;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={shown > 0 ? `Open cart, ${shown} ${shown === 1 ? "item" : "items"}` : "Open cart"}
      className={buttonStyles({
        variant: "ghost",
        size: "icon",
        className: "relative",
      })}
    >
      <ShoppingBag aria-hidden />
      {shown > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.6875rem] font-semibold text-accent-ink">
          {shown}
        </span>
      )}
    </button>
  );
}
