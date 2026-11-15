"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Box, ScanLine } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export type Spotlight = { name: string; price: number; slug: string } | null;

/**
 * The hero picture, kept simple: one cognac leather sofa on a soft cream
 * circle with a thin copper ring, a slim side table with a vase of dry
 * branches, and two small floating labels. Drawn in SVG; gently floats.
 */
export function HeroSofa({ play, spotlight }: { play: boolean; spotlight: Spotlight }) {
  const reduce = useReducedMotion() ?? false;
  const show = play || reduce;
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="relative mx-auto w-full max-w-[40rem]">
      <motion.svg
        viewBox="0 0 700 520"
        className="relative w-full overflow-visible"
        role="img"
        aria-label="Illustration of a cognac leather sofa with a cream cushion, beside a slim side table with a vase of dry branches"
        initial={reduce ? false : { opacity: 0, y: 30 }}
        animate={show ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 1.2, delay: 0.2, ease }}
      >
        <defs>
          <radialGradient id="hs-disc" cx="0.45" cy="0.4" r="0.6">
            <stop offset="0" style={{ stopColor: "var(--h-disc-a)" }} />
            <stop offset="1" style={{ stopColor: "var(--h-disc-b)" }} />
          </radialGradient>
          <linearGradient id="hs-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b8703f" />
            <stop offset="1" stopColor="#8f4f26" />
          </linearGradient>
          <linearGradient id="hs-seat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c27c49" />
            <stop offset="1" stopColor="#9a5527" />
          </linearGradient>
          <linearGradient id="hs-arm" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a8622f" />
            <stop offset="0.5" stopColor="#c27c49" />
            <stop offset="1" stopColor="#8f4f26" />
          </linearGradient>
          <linearGradient id="hs-brass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#9c7a3a" />
            <stop offset="0.5" stopColor="#d9b874" />
            <stop offset="1" stopColor="#8a6a2f" />
          </linearGradient>
          <radialGradient id="hs-shadow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" style={{ stopColor: "var(--h-shadow)" }} />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* backdrop: cream disc and a thin copper ring */}
        <circle cx="340" cy="250" r="230" fill="url(#hs-disc)" />
        <motion.circle
          cx="340"
          cy="250"
          r="248"
          fill="none"
          style={{ stroke: "var(--h-accent)", transformOrigin: "340px 250px" }}
          strokeOpacity="0.5"
          strokeWidth="1.2"
          strokeDasharray="2 7"
          initial={reduce ? false : { rotate: 0 }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        />
        <circle cx="340" cy="2" r="5" style={{ fill: "var(--h-accent)" }} opacity="0.85" />

        <motion.g
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* floor shadow */}
          <ellipse cx="320" cy="430" rx="260" ry="20" fill="url(#hs-shadow)" />

          {/* side table with vase */}
          <ellipse cx="610" cy="300" rx="44" ry="8" fill="url(#hs-brass)" />
          <path d="M610 304V426M592 426h36" stroke="#8a6a2f" strokeWidth="4" strokeLinecap="round" />
          <path d="M598 300c-6-24 0-40 4-52h16c4 12 10 28 4 52z" fill="#efe4d2" stroke="#d8c7ad" strokeWidth="1.5" />
          <g style={{ stroke: "var(--h-branch)" }} strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M610 250C606 200 590 170 566 140" />
            <path d="M592 196l-20-12M582 174l6-22" />
            <path d="M612 250C618 196 636 168 660 142" />
            <path d="M628 192l22-4M642 170l-4-22" />
            <path d="M610 250V120" />
          </g>

          {/* sofa: legs, arms, back, seat */}
          {[118, 170, 470, 522].map((x) => (
            <path key={x} d={`M${x} 402l4 26h6l2-26z`} fill="#4a2e18" />
          ))}
          <rect x="96" y="226" width="80" height="182" rx="38" fill="url(#hs-arm)" />
          <rect x="464" y="226" width="80" height="182" rx="38" fill="url(#hs-arm)" />
          <rect x="124" y="170" width="392" height="150" rx="48" fill="url(#hs-back)" />
          <path d="M254 180v120M386 180v120" stroke="#7d4120" strokeWidth="2" opacity="0.5" />
          <rect x="140" y="178" width="360" height="16" rx="8" fill="#e09a63" opacity="0.35" />
          <rect x="132" y="300" width="376" height="104" rx="30" fill="url(#hs-seat)" />
          <path d="M258 306v94M382 306v94" stroke="#7d4120" strokeWidth="2" opacity="0.45" />
          <rect x="140" y="306" width="360" height="14" rx="7" fill="#e7a873" opacity="0.4" />
          {/* piping along the seat */}
          <path d="M150 400h340" stroke="#6e3a1a" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          {/* cream cushion */}
          <g transform="rotate(-8 214 262)">
            <rect x="166" y="222" width="100" height="82" rx="22" fill="#f4ead9" />
            <rect x="166" y="222" width="100" height="82" rx="22" fill="none" stroke="#dccab0" strokeWidth="2" strokeDasharray="3 5" />
          </g>
        </motion.g>
      </motion.svg>

      {/* floating labels */}
      {spotlight && (
        <motion.div
          className="absolute top-[12%] left-0 sm:left-[2%]"
          initial={reduce ? false : { opacity: 0, x: -16 }}
          animate={show ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.8, delay: 1.1, ease }}
        >
          <Link
            href={`/shop/${spotlight.slug}`}
            className="block rounded-2xl bg-[var(--h-card-bg)] px-4 py-3 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.45)] ring-1 ring-[var(--h-card-ring)] backdrop-blur transition hover:-translate-y-0.5"
          >
            <span className="block font-mono text-[0.6rem] tracking-[0.16em] text-[var(--h-card-label)] uppercase">Featured</span>
            <span className="mt-0.5 block max-w-[12rem] truncate text-sm font-semibold text-[var(--h-ink)]">{spotlight.name}</span>
            <span className="block text-sm text-[var(--h-muted)] tabular-nums">{formatPrice(spotlight.price)}</span>
          </Link>
        </motion.div>
      )}
      <motion.p
        className="absolute right-[2%] bottom-[16%] inline-flex items-center gap-2 rounded-full bg-[var(--h-pill-bg)] px-3.5 py-2 text-xs font-medium text-[var(--h-pill-ink)] shadow-[0_14px_30px_-14px_rgb(27_23_20/0.6)]"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={show ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.8, delay: 1.3, ease }}
      >
        <Box className="size-3.5 text-[var(--h-pill-icon)]" aria-hidden />
        View in 3D
        <span className="opacity-40">·</span>
        <ScanLine className="size-3.5 text-[var(--h-pill-icon)]" aria-hidden />
        AR
      </motion.p>
    </div>
  );
}
