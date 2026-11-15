"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ScanLine, Star } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { useIntroDone } from "@/hooks/use-intro-done";
import type { HomeContent } from "@/lib/data/content";
import { EASE_OUT } from "@/lib/motion";
import { HeroArtwork } from "./hero-artwork";

type HeroContentProps = {
  stats: { pieces: number; models: number; reviews: number; rating: number };
  categoryCount: number;
  /** Text edited in the admin panel (Home page). */
  content: HomeContent;
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
 * Hero: copy on the left over a quiet dark ground, and a large framed
 * picture of a sunlit room on the right (stacked below on phones). Kept
 * deliberately simple: a label, a three-line headline, one sentence, two
 * actions and a line of facts. Entrances wait for the intro loader.
 */
export function HeroContent({ stats, categoryCount, content }: HeroContentProps) {
  const play = useIntroDone();
  const reduce = useReducedMotion();
  const go = play || !!reduce;

  const fade = (d: number) => ({
    initial: { opacity: 0, y: 20, filter: "blur(6px)" },
    animate: go ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined,
    transition: { duration: 0.9, delay: d, ease: EASE_OUT },
  });

  return (
    <div className="container-page relative grid min-h-svh grid-cols-[minmax(0,1fr)] content-center gap-10 pt-[calc(4.25rem+2.5rem)] pb-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14 lg:pt-[calc(4.25rem+2rem)] lg:pb-14">
      <div className="min-w-0">
        {content.eyebrow && (
          <motion.p
            {...fade(0)}
            className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.06] py-1.5 pr-4 pl-2 text-[0.8rem] font-medium text-white/80 backdrop-blur"
          >
            <span className="relative grid size-5 shrink-0 place-items-center rounded-full bg-[#e3a56f]/20" aria-hidden>
              <span className="ping-soft absolute inset-0 rounded-full bg-[#e3a56f]/30" />
              <span className="size-2 rounded-full bg-[#e3a56f]" />
            </span>
            <span className="truncate">{content.eyebrow}</span>
          </motion.p>
        )}

        <h1 className="mt-7 text-[clamp(2.9rem,min(5.6vw,11svh),6.4rem)] leading-[0.92] font-semibold tracking-[-0.045em] text-white">
          <Line i={0} play={go}>
            {content.line1}
          </Line>
          <Line i={1} play={go}>
            {content.line2}
          </Line>
          <Line i={2} play={go}>
            <em className="text-gradient">{content.line3}</em>.
          </Line>
        </h1>

        <motion.div {...fade(0.5)} className="mt-8">
          {content.sentence && <p className="max-w-md text-lg leading-relaxed text-white/70">{content.sentence}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={content.primaryHref} className={buttonStyles({ size: "lg" })}>
              {content.primaryLabel}
              <ArrowRight aria-hidden />
            </Link>
            {content.secondaryLabel && content.secondaryHref && (
              <Link
                href={content.secondaryHref}
                className={buttonStyles({
                  variant: "outline",
                  size: "lg",
                  className: "border-white/20 bg-white/10 text-white hover:bg-white/20",
                })}
              >
                <ScanLine aria-hidden />
                {content.secondaryLabel}
              </Link>
            )}
          </div>
        </motion.div>

        {/* One quiet line of facts instead of a stats block. */}
        <motion.p
          {...fade(0.7)}
          className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-6 text-sm text-white/55"
        >
          <span>
            <span className="font-medium text-white">{stats.pieces}</span> pieces
          </span>
          <span aria-hidden className="text-white/25">·</span>
          <span>
            <span className="font-medium text-white">{stats.models}</span> in 3D &amp; AR
          </span>
          <span aria-hidden className="text-white/25">·</span>
          {stats.reviews > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-3.5 fill-[#e3a56f] text-[#e3a56f]" aria-hidden />
              <span className="font-medium text-white">{stats.rating.toFixed(1)}</span> from {stats.reviews}{" "}
              {stats.reviews === 1 ? "review" : "reviews"}
            </span>
          ) : (
            <span>
              <span className="font-medium text-white">{categoryCount}</span> categories
            </span>
          )}
        </motion.p>
      </div>

      <div className="relative h-[min(62svh,30rem)] min-h-[20rem] sm:h-[min(70svh,38rem)] lg:h-[min(80svh,46rem)]">
        <HeroArtwork play={go} />
      </div>
    </div>
  );
}
