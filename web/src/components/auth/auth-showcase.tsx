"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Box, Heart, PackageCheck } from "lucide-react";
import { LogoMark } from "@/components/layout/logo-mark";
import { EASE_OUT } from "@/lib/motion";
import { assetUrl } from "@/lib/utils";

const SLIDES = [
  { icon: Box, title: "See it in your room first", text: "Place any 3D piece on your own floor with AR before you decide." },
  { icon: PackageCheck, title: "Every order, tracked", text: "Follow each piece from our workshop to your door." },
  { icon: Heart, title: "Save what you love", text: "Keep a wishlist and come back to it on any device." },
];

/**
 * The art side of the login and register pages: a slow drifting room scene
 * with the benefits of an account rotating over it.
 */
export function AuthShowcase() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, [reduce]);

  const slide = SLIDES[index];

  return (
    <div className="enter-reveal relative isolate flex h-full min-h-[34rem] flex-col justify-between overflow-hidden rounded-panel bg-surface-2 p-8 text-white xl:p-10">
      <Image
        src={assetUrl("image/rooms/leather.svg")!}
        alt=""
        fill
        preload
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="ken-burns -z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />

      <div className="flex items-center gap-3">
        <LogoMark className="size-8 text-white" />
        <span className="h-6 w-px bg-white/25" />
        <span className="text-xs font-semibold tracking-[0.26em] uppercase">Home Decor</span>
      </div>

      <div>
        <div className="relative min-h-44">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            >
              <span className="grid size-12 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md">
                <slide.icon className="size-5 text-[#f3cf9e]" aria-hidden />
              </span>
              <p className="mt-6 max-w-md text-3xl leading-tight font-semibold xl:text-4xl">{slide.title}</p>
              <p className="mt-3 max-w-sm text-white/70">{slide.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dashes: the active one fills over the slide's lifetime. */}
        <div className="mt-8 flex gap-2" aria-hidden>
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              tabIndex={-1}
              onClick={() => setIndex(i)}
              className="relative h-1 w-10 overflow-hidden rounded-full bg-white/20"
            >
              {i === index && (
                <motion.span
                  key={`fill-${index}`}
                  className="absolute inset-0 origin-left rounded-full bg-white"
                  initial={{ scaleX: reduce ? 1 : 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: reduce ? 0 : 4.5, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
