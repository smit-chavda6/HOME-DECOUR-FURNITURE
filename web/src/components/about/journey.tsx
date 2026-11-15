"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { EASE_OUT } from "@/lib/motion";

type Step = { year: string; title: string; text: string };

/**
 * The company timeline. A copper rail fills as you scroll through it and
 * each milestone's node lights up and its text rises in as the rail reaches it.
 */
export function Journey({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 80, damping: 24 });

  return (
    <ol ref={ref} className="relative mt-14 grid gap-12 pl-10 lg:grid-cols-4 lg:gap-8 lg:pt-14 lg:pl-0">
      {/* rail: vertical on phones, horizontal on desktop */}
      <span aria-hidden className="absolute top-2 bottom-2 left-[0.6875rem] w-px bg-line lg:top-[0.6875rem] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto" />
      <motion.span
        aria-hidden
        style={reduce ? undefined : { scaleY: fill }}
        className="absolute top-2 bottom-2 left-[0.6875rem] w-px origin-top bg-accent lg:hidden"
      />
      <motion.span
        aria-hidden
        style={reduce ? undefined : { scaleX: fill }}
        className="absolute top-[0.6875rem] right-0 left-0 hidden h-px origin-left bg-accent lg:block"
      />

      {steps.map((step, i) => (
        <motion.li
          key={step.year}
          className="relative"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -120px 0px" }}
          transition={{ duration: 0.8, delay: i * 0.12, ease: EASE_OUT }}
        >
          <span
            aria-hidden
            className="absolute top-1 -left-10 grid size-[1.375rem] place-items-center rounded-full border border-accent bg-bg lg:-top-14 lg:left-0"
          >
            <span className="size-2 rounded-full bg-accent" />
          </span>
          <p className="font-mono text-sm tracking-[0.2em] text-accent">{step.year}</p>
          <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>
          <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
        </motion.li>
      ))}
    </ol>
  );
}
