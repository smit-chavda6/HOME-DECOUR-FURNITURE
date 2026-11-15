"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { assetUrl } from "@/lib/utils";

const chapters = [
  {
    kicker: "01 — Design",
    title: (
      <>
        Shaped around <em className="text-gradient">how you live</em>.
      </>
    ),
    text: "Generous seats, honest proportions and lines that stay calm in any room.",
    image: "image/rooms/lounge.svg",
    alt: "Illustrated lounge with a sage velvet loveseat, travertine side table and tufted accent chair",
  },
  {
    kicker: "02 — Craft",
    title: (
      <>
        Materials that <em className="text-gradient">age well</em>.
      </>
    ),
    text: "Solid woods, dense foams, velvet and full-grain leather, chosen to last for years, not seasons.",
    image: "image/rooms/leather.svg",
    alt: "Illustrated room with a cognac leather Chesterfield sofa, leather ottoman and ladder bookshelf",
  },
  {
    kicker: "03 — Certainty",
    title: (
      <>
        Seen in <em className="text-gradient">your room</em> before it ships.
      </>
    ),
    text: "Open a piece in the AR room, place it on your floor at real size, and walk around it.",
    image: "image/rooms/study.svg",
    alt: "Illustrated study with a walnut writing desk, task chair and ladder bookshelf",
  },
];

function useChapterRange(index: number) {
  const step = 1 / chapters.length;
  return { start: index * step, end: (index + 1) * step, step };
}

/** Text for one chapter: fades in, holds, fades out as the section scrolls. */
function ChapterText({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const { start, end, step } = useChapterRange(index);
  const first = index === 0;
  const last = index === chapters.length - 1;
  const opacity = useTransform(
    progress,
    [start, start + step * 0.2, end - step * 0.2, end],
    [first ? 1 : 0, 1, 1, last ? 1 : 0],
  );
  const y = useTransform(progress, [start, end], [50, -50]);
  const c = chapters[index];

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center">
      <p className="eyebrow">{c.kicker}</p>
      <h2 className="mt-5 text-4xl leading-[0.95] font-semibold sm:text-5xl lg:text-6xl">{c.title}</h2>
      <p className="mt-5 max-w-md text-lg text-muted">{c.text}</p>
    </motion.div>
  );
}

/** Photo for one chapter: wipes up over the previous one and slowly zooms out. */
function ChapterImage({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const { start, step } = useChapterRange(index);
  // Scroll-linked animations need offsets inside 0..1, in increasing order.
  const revealStart = Math.max(0, start - step * 0.25);
  const revealEnd = start + step * 0.15;
  const clip = useTransform(
    progress,
    [revealStart, revealEnd],
    index === 0 ? ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)"] : ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"],
  );
  const scale = useTransform(progress, [revealStart, start + step], [1.25, 1]);
  const c = chapters[index];

  return (
    <motion.div style={{ clipPath: clip }} className="absolute inset-0 overflow-hidden">
      <motion.div style={{ scale }} className="absolute inset-0">
        <Image src={assetUrl(c.image)!} alt={c.alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
      </motion.div>
    </motion.div>
  );
}

/**
 * A tall section that stays pinned while you scroll through it. Three short
 * chapters change on the left while full photographs wipe in on the right.
 */
export function ScrollStory() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Without motion, show the chapters as a simple stacked list.
  if (reduce) {
    return (
      <section className="container-page mt-28 space-y-16">
        {chapters.map((c) => (
          <div key={c.kicker} className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow">{c.kicker}</p>
              <h2 className="mt-4 text-4xl font-semibold">{c.title}</h2>
              <p className="mt-3 text-muted">{c.text}</p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-panel">
              <Image src={assetUrl(c.image)!} alt={c.alt} fill sizes="50vw" className="object-cover" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section ref={ref} className="relative mt-20 h-[340vh]" aria-label="How our furniture is made">
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div className="spotlight pointer-events-none absolute inset-0 [--x:20%] [--y:50%]" />
        <div className="relative container-page grid h-full content-center items-center gap-8 pt-16 lg:grid-cols-[0.85fr_1.15fr] lg:pt-0">
          <div className="relative h-60 sm:h-64 lg:h-80">
            {chapters.map((c, i) => (
              <ChapterText key={c.kicker} index={i} progress={scrollYProgress} />
            ))}
          </div>

          <div className="relative h-[42svh] overflow-hidden rounded-panel border border-line bg-surface-2 lg:h-[72svh]">
            {chapters.map((c, i) => (
              <ChapterImage key={c.kicker} index={i} progress={scrollYProgress} />
            ))}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-8 container-page flex items-center gap-6">
          <div className="h-px flex-1 overflow-hidden bg-line">
            <motion.div style={{ width: bar }} className="h-full bg-accent" />
          </div>
          <Link href="/ar/live" className={buttonStyles({ variant: "outline", size: "sm" })}>
            Open the AR room
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
