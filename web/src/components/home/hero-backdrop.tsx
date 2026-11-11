"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * The hero photograph. It zooms out slowly on load, drifts a little with the
 * mouse for a sense of depth, and sinks behind the content as you scroll.
 */
export function HeroBackdrop({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scrollY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.6]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(useTransform(mx, [-1, 1], [18, -18]), { stiffness: 60, damping: 20 });
  const y = useSpring(useTransform(my, [-1, 1], [12, -12]), { stiffness: 60, damping: 20 });

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  return (
    <div ref={ref} onPointerMove={onPointerMove} className="absolute inset-0 -z-10 overflow-hidden bg-black">
      <motion.div
        className="absolute -inset-[4%]"
        style={reduce ? undefined : { x, y, translateY: scrollY }}
        initial={reduce ? false : { scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image src={src} alt={alt} fill preload sizes="100vw" className="object-cover object-[50%_60%]" />
      </motion.div>

      {/* Darken the left and bottom so the headline always reads clearly. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-black/45 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(45rem_30rem_at_18%_40%,rgb(227_165_111/0.18),transparent_70%)]" />
      <motion.div className="absolute inset-0 bg-[#0a0908]" style={{ opacity: dim }} />
    </div>
  );
}
