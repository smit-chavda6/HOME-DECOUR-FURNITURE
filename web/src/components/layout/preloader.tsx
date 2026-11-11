"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { INTRO_SEEN_KEY as SEEN_KEY } from "@/lib/inline-scripts";

/**
 * Brand intro shown once per browser session on first load.
 *
 * Rendered visible in the server HTML so the page underneath never flashes;
 * the head script in the root layout hides it for returning visitors.
 */
export function Preloader() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alreadySeen = true;
    try {
      alreadySeen = Boolean(sessionStorage.getItem(SEEN_KEY));
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage blocked: skip the intro rather than show it every time.
    }
    if (alreadySeen || reduceMotion) {
      // Already hidden by CSS from the head script; drop it from the tree next frame.
      const id = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(id);
    }

    const start = performance.now();
    const duration = 1500;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) frame = requestAnimationFrame(tick);
      else setTimeout(() => setVisible(false), 250);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion]);

  return (
    <>
      <style>{`.intro-done [data-preloader]{display:none}`}</style>
      <AnimatePresence>
        {visible && (
          <motion.div
            data-preloader
            aria-hidden
            className="fixed inset-0 z-[80] flex flex-col justify-between overflow-hidden bg-[#0a0908] p-6 text-[#f5f0e8] sm:p-10"
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            initial={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            onClick={() => setVisible(false)}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(50rem 30rem at 50% 60%, rgb(227 165 111 / 0.18), transparent 70%)" }}
            />
            <p className="relative text-xs tracking-[0.3em] text-[#a1978a] uppercase">Ahmedabad · Since 2014</p>

            <div className="relative">
              <div className="overflow-hidden">
                <motion.p
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="text-[clamp(3rem,13vw,11rem)] leading-[0.85] font-semibold tracking-[-0.06em]"
                >
                  Home Decor
                </motion.p>
              </div>
              <div className="overflow-hidden">
                <motion.p
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif text-[clamp(3rem,13vw,11rem)] leading-[0.95] text-[#e3a56f] italic"
                >
                  Furniture.
                </motion.p>
              </div>
            </div>

            <div className="relative flex items-end justify-between gap-6">
              <p className="max-w-xs text-sm text-[#a1978a]">See every piece in your own room before it arrives.</p>
              <p className="text-6xl font-light tabular-nums sm:text-8xl">{count}</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
              <div className="h-full bg-[#e3a56f]" style={{ width: `${count}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
