"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ScanLine, Star } from "lucide-react";
import { useIntroDone } from "@/hooks/use-intro-done";
import type { HomeContent } from "@/lib/data/content";
import { EASE_OUT } from "@/lib/motion";
import { HeroSofa, type Spotlight } from "./hero-sofa";

type HeroContentProps = {
  stats: { pieces: number; models: number; reviews: number; rating: number };
  categoryCount: number;
  /** Text edited in the admin panel (Home page). */
  content: HomeContent;
  /** A featured product shown in a small label beside the sofa. */
  spotlight: Spotlight;
};

/** One headline line that rises out of its own mask. */
function Line({ children, i, play }: { children: React.ReactNode; i: number; play: boolean }) {
  return (
    // Padding gives italic overhangs and descenders room inside the mask.
    <span className="-mx-[0.1em] -mb-[0.12em] block overflow-hidden px-[0.1em] pb-[0.12em]">
      <motion.span
        className="block"
        initial={{ y: "108%" }}
        animate={play ? { y: "0%" } : undefined}
        transition={{ duration: 1.15, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * Hero copy on warm sand: espresso text with the copper italic accent,
 * two buttons and a line of facts, beside one simple sofa illustration.
 * Entrances wait for the intro loader.
 */
export function HeroContent({ stats, categoryCount, content, spotlight }: HeroContentProps) {
  const play = useIntroDone();
  const reduce = useReducedMotion();
  const go = play || !!reduce;

  const fade = (d: number) => ({
    initial: { opacity: 0, y: 20, filter: "blur(6px)" },
    animate: go ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
    transition: { duration: 0.9, delay: d, ease: EASE_OUT },
  });

  return (
    <div className="container-page grid min-h-svh grid-cols-[minmax(0,1fr)] content-center gap-10 pt-[calc(4.25rem+2.5rem)] pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-8 lg:pt-[calc(4.25rem+1.5rem)]">
      <div className="min-w-0">
        {content.eyebrow && (
          <motion.p
            {...fade(0)}
            className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-[#dccab0] bg-white/60 py-1.5 pr-4 pl-2 text-[0.8rem] font-medium text-[#4a3f36]"
          >
            <span className="relative grid size-5 shrink-0 place-items-center rounded-full bg-[#b8703f]/15" aria-hidden>
              <span className="ping-soft absolute inset-0 rounded-full bg-[#b8703f]/25" />
              <span className="size-2 rounded-full bg-[#b8703f]" />
            </span>
            <span className="truncate">{content.eyebrow}</span>
          </motion.p>
        )}

        <h1 className="mt-6 text-[clamp(2.8rem,min(6vw,11svh),6.6rem)] leading-[0.92] font-semibold tracking-[-0.045em] text-[#1b1714]">
          <Line i={0} play={go}>
            {content.line1}
          </Line>
          <Line i={1} play={go}>
            {content.line2}
          </Line>
          <Line i={2} play={go}>
            <em className="pr-[0.05em] text-[#b8703f]">{content.line3}</em>.
          </Line>
        </h1>

        <motion.div {...fade(0.5)} className="mt-7">
          {content.sentence && <p className="max-w-md text-lg leading-relaxed text-[#5c5148]">{content.sentence}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={content.primaryHref}
              className="inline-flex h-13 items-center gap-2 rounded-full bg-[#1b1714] px-8 text-[0.95rem] font-medium text-[#f7efe3] shadow-[0_14px_30px_-14px_rgb(27_23_20/0.6)] transition hover:bg-[#2d2620] active:scale-[0.98] [&_svg]:size-4"
            >
              {content.primaryLabel}
              <ArrowRight aria-hidden />
            </Link>
            {content.secondaryLabel && content.secondaryHref && (
              <Link
                href={content.secondaryHref}
                className="inline-flex h-13 items-center gap-2 rounded-full border border-[#b8703f]/50 px-8 text-[0.95rem] font-medium text-[#8a4c24] transition hover:bg-[#b8703f]/10 active:scale-[0.98] [&_svg]:size-4"
              >
                <ScanLine aria-hidden />
                {content.secondaryLabel}
              </Link>
            )}
          </div>
        </motion.div>

        <motion.p {...fade(0.7)} className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#dccab0] pt-6 text-sm text-[#6b5d50]">
          <span>
            <span className="font-semibold text-[#1b1714]">{stats.pieces}</span> pieces
          </span>
          <span aria-hidden className="text-[#c9b79c]">·</span>
          <span>
            <span className="font-semibold text-[#1b1714]">{stats.models}</span> in 3D &amp; AR
          </span>
          <span aria-hidden className="text-[#c9b79c]">·</span>
          {stats.reviews > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-3.5 fill-[#b8703f] text-[#b8703f]" aria-hidden />
              <span className="font-semibold text-[#1b1714]">{stats.rating.toFixed(1)}</span> from {stats.reviews}{" "}
              {stats.reviews === 1 ? "review" : "reviews"}
            </span>
          ) : (
            <span>
              <span className="font-semibold text-[#1b1714]">{categoryCount}</span> categories
            </span>
          )}
        </motion.p>
      </div>

      <HeroSofa play={go} spotlight={spotlight} />
    </div>
  );
}
