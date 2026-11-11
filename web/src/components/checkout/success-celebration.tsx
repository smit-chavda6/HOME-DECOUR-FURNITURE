"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

const COLORS = ["#e3a56f", "#f3cf9e", "#a8b596", "#f5f0e8", "#c98b55"];

/** A one-time burst of confetti and a check mark that draws itself. */
export function SuccessCelebration() {
  const reduce = useReducedMotion();

  // Fixed pseudo-random layout so server and browser agree.
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => {
        const angle = (i / 46) * Math.PI * 2 + ((i * 37) % 10) / 10;
        const distance = 160 + ((i * 53) % 220);
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 80,
          rotate: ((i * 97) % 360) - 180,
          color: COLORS[i % COLORS.length],
          size: 6 + ((i * 7) % 7),
          round: i % 3 === 0,
          delay: ((i * 13) % 10) / 60,
        };
      }),
    [],
  );

  return (
    <div className="relative mx-auto grid size-28 place-items-center">
      {!reduce &&
        pieces.map((p, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute top-1/2 left-1/2"
            style={{
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              background: p.color,
              borderRadius: p.round ? "999px" : "2px",
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
            animate={{ x: p.x, y: [0, p.y, p.y + 260], opacity: [1, 1, 0], rotate: p.rotate * 3, scale: 1 }}
            transition={{ duration: 2.4, delay: 0.35 + p.delay, ease: [0.16, 1, 0.3, 1], times: [0, 0.45, 1] }}
          />
        ))}

      <motion.div
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle,var(--glow),transparent_70%)]"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1.6, opacity: [0, 1, 0.6] }}
        transition={{ duration: 1.2 }}
      />
      <motion.svg
        viewBox="0 0 52 52"
        className="relative size-24"
        initial={{ scale: reduce ? 1 : 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.45, duration: 0.8 }}
        aria-hidden
      >
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <motion.path
          d="M15 27 l7 7 l15 -16"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.55, ease: "easeOut" }}
        />
      </motion.svg>
    </div>
  );
}
