"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { MapPin, Truck } from "lucide-react";
import type { Totals } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/stores/cart";

/** Counts up to the new total whenever it changes. */
function AnimatedPrice({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => formatPrice(Math.round(v)));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

type OrderCardProps = {
  items: CartItem[];
  totals: Totals;
  /** Show the delivery side of the card (on the review step). */
  flipped: boolean;
  address: { name: string; lines: string } | null;
};

/**
 * The order summary as a physical card that tilts toward the pointer and
 * flips over to show the delivery details on the review step.
 */
export function OrderCard({ items, totals, flipped, address }: OrderCardProps) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-1, 1], [7, -7]), { stiffness: 120, damping: 14 });
  const rotateY = useSpring(useTransform(px, [-1, 1], [-9, 9]), { stiffness: 120, damping: 14 });
  const glareX = useTransform(px, [-1, 1], ["0%", "100%"]);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }

  const face =
    "absolute inset-0 overflow-hidden rounded-panel border border-glass-line bg-[linear-gradient(150deg,var(--surface-2),var(--surface)_60%)] p-6 shadow-[var(--shadow)] [backface-visibility:hidden]";

  return (
    <div
      className="[perspective:1400px]"
      onPointerMove={onMove}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative h-[27rem]"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="absolute inset-0"
        >
          {/* Front: what you are buying */}
          <div className={face}>
            <motion.div
              aria-hidden
              style={{ left: glareX }}
              className="pointer-events-none absolute -top-1/2 h-[200%] w-1/3 -translate-x-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
            />
            <div className="flex items-center justify-between">
              <p className="eyebrow">Your order</p>
              <p className="text-xs text-muted">
                {(() => {
                  const count = items.reduce((n, i) => n + i.quantity, 0);
                  return `${count} ${count === 1 ? "item" : "items"}`;
                })()}
              </p>
            </div>

            <ul className="no-scrollbar mt-5 max-h-40 space-y-3 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    {item.image && <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />}
                    <span className="absolute right-0.5 bottom-0.5 grid size-4.5 place-items-center rounded-full bg-ink text-[0.6rem] font-bold text-bg">
                      {item.quantity}
                    </span>
                  </span>
                  <span className="line-clamp-1 flex-1 text-sm">{item.name}</span>
                  <span className="text-sm tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="absolute inset-x-6 bottom-6 space-y-1.5 border-t border-line pt-4 text-sm tabular-nums">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">GST (18%)</dt>
                <dd>{formatPrice(totals.tax)}</dd>
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <dt className="font-medium">Total</dt>
                <dd className="text-gradient text-3xl font-semibold">
                  <AnimatedPrice value={totals.total} />
                </dd>
              </div>
            </dl>
          </div>

          {/* Back: where it is going */}
          <div className={`${face} [transform:rotateY(180deg)]`}>
            <p className="eyebrow">Delivering to</p>
            {address ? (
              <div className="mt-6">
                <p className="text-2xl font-semibold">{address.name}</p>
                <p className="mt-3 flex gap-2 text-sm leading-relaxed text-muted">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  {address.lines}
                </p>
              </div>
            ) : null}
            <div className="absolute inset-x-6 bottom-6 space-y-4">
              <p className="flex items-center gap-2 text-sm text-muted">
                <Truck className="size-4 text-accent" aria-hidden />
                Arrives in 7 to 14 business days, assembled by our team.
              </p>
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <span className="font-medium">To pay</span>
                <span className="text-gradient text-3xl font-semibold tabular-nums">
                  <AnimatedPrice value={totals.total} />
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
