"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "motion/react";
import { markIntroDone } from "@/hooks/use-intro-done";
import { INTRO_SEEN_KEY as SEEN_KEY } from "@/lib/inline-scripts";
import { site } from "@/lib/site";

const LINE_1 = "HOME DECOR";
const LINE_2 = "FURNITURE";
const OUT = [0.16, 1, 0.3, 1] as const; // power4.out
const IN_OUT = [0.77, 0, 0.175, 1] as const;

/** Letters as masked spans (tagged for animation); a space becomes a fixed gap. */
function Letters({ text, tag }: { text: string; tag: "data-l1" | "data-l2" }) {
  return (
    <>
      {text.split("").map((ch, i) =>
        ch === " " ? (
          <span key={i} className="inline-block w-[0.3em]" />
        ) : (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            {/* Inline transform, not a Tailwind translate class: Tailwind v4 uses the
                separate `translate` property, which would stack under motion's transform. */}
            <span {...{ [tag]: "" }} className="inline-block" style={{ transform: "translateY(115%)" }}>
              {ch}
            </span>
          </span>
        ),
      )}
    </>
  );
}

/**
 * Brand intro, rebuilt from the original site's preloader:
 *
 * 1. "HOME DECOR" rises letter by letter while a counter and hairline run to 50.
 * 2. "FURNITURE" follows, the counter reaches 100 and the HomeSphere line fades in.
 * 3. On wide screens the wordmark glides up into the navbar logo; on phones it lifts away.
 * 4. The screen splits open like two doors onto the page.
 *
 * Shown once per browser session. The server renders it visible so the page
 * never flashes underneath; the head script hides it for returning visitors
 * and for reduced motion (it marks <html> with "intro-done").
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const stopIntro = useRef<() => void>(() => {});
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Decided by the head script before paint, so it's stable across the
    // double effect run in React dev mode.
    if (document.documentElement.classList.contains("intro-done")) {
      const id = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(id);
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage blocked: the head script skips the intro in that case.
    }

    const el = root.current!;
    const q = (sel: string) => el.querySelectorAll<HTMLElement>(sel);
    const one = (sel: string) => el.querySelector<HTMLElement>(sel)!;
    const counter = one("[data-counter]");
    const brand = one("[data-brand]");
    const controls: { stop: () => void }[] = [];
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(() => el.isConnected && fn(), ms));
    const run = (...args: unknown[]) => {
      // animate() has many overloads; this keeps every call stoppable on unmount.
      const c = (animate as (...a: unknown[]) => { stop: () => void })(...args);
      controls.push(c);
      return c;
    };
    const count = (from: number, to: number, duration: number) =>
      run(from, to, {
        duration,
        ease: [0.45, 0, 0.55, 1],
        onUpdate: (v: number) => (counter.textContent = String(Math.floor(v)).padStart(3, "0")),
      });

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const stopAll = () => {
      controls.forEach((c) => c.stop());
      timers.forEach(clearTimeout);
      html.style.overflow = prevOverflow;
    };
    stopIntro.current = stopAll;
    const finish = () => {
      stopAll();
      setVisible(false);
      markIntroDone();
    };

    // Phase 1: HOME DECOR, counter to 50.
    run(q("[data-l1]"), { y: ["115%", "0%"] }, { duration: 1.1, delay: stagger(0.05), ease: OUT });
    run(q("[data-meta]"), { opacity: [0, 1] }, { duration: 0.6, delay: 0.35 });
    at(150, () => count(0, 50, 1.3));
    run(one("[data-fill]"), { scaleX: [0, 0.5] }, { duration: 1.3, delay: 0.15, ease: [0.45, 0, 0.55, 1] });

    // Phase 2: FURNITURE, counter to 100, tagline.
    run(q("[data-l2]"), { y: ["115%", "0%"] }, { duration: 1, delay: stagger(0.04, { startDelay: 1.25 }), ease: OUT });
    at(1450, () => count(50, 100, 1));
    run(one("[data-fill]"), { scaleX: [0.5, 1] }, { duration: 1, delay: 1.45, ease: [0.45, 0, 0.55, 1] });
    run(one("[data-tagline]"), { opacity: [0, 1], y: [8, 0] }, { duration: 0.8, delay: 1.8, ease: OUT });

    // Phase 3: brief hold, then clear the extras.
    at(2750, () => {
      run(q("[data-meta], [data-tagline]"), { opacity: 0 }, { duration: 0.35 });
      run(q("[data-l2]"), { opacity: 0 }, { duration: 0.35 });
    });

    // Phase 4: glide into the navbar wordmark (desktop) or lift away (phone).
    at(2950, () => {
      const target = document.querySelector<HTMLElement>("[data-brand-target]");
      const line1 = one("[data-line1]");
      const desktop = window.innerWidth >= 768 && target && target.offsetParent !== null;
      if (desktop) {
        // Scale happens around the brand's centre (C), so move line 1's centre
        // (L) onto the target's centre (T): d = T - C - scale * (L - C).
        const t = target.getBoundingClientRect();
        const l = line1.getBoundingClientRect();
        const c = brand.getBoundingClientRect();
        const scale = t.width / l.width;
        const cx = c.left + c.width / 2;
        const cy = c.top + c.height / 2;
        const dx = t.left + t.width / 2 - cx - scale * (l.left + l.width / 2 - cx);
        const dy = t.top + t.height / 2 - cy - scale * (l.top + l.height / 2 - cy);
        run(brand, { x: dx, y: dy, scale }, { duration: 1.1, ease: IN_OUT });
      } else {
        run(brand, { y: -30, scale: 0.85, opacity: 0 }, { duration: 0.8, ease: IN_OUT });
      }
    });

    // Phase 5: doors open; the real navbar is now where the wordmark landed.
    at(3850, () => {
      markIntroDone();
      run(one("[data-door-l]"), { x: "-100%" }, { duration: 0.75, ease: [0.65, 0, 0.35, 1] });
      run(one("[data-door-r]"), { x: "100%" }, { duration: 0.75, ease: [0.65, 0, 0.35, 1] });
      run(brand, { opacity: 0 }, { duration: 0.35, delay: 0.25 });
    });
    at(4650, finish);

    return stopAll;
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`.intro-done [data-preloader]{display:none}`}</style>
      <div
        ref={root}
        data-preloader
        aria-hidden
        className="fixed inset-0 z-[80] overflow-hidden text-ink"
        onClick={() => {
          // Skip: stop every pending step before the elements disappear.
          stopIntro.current();
          setVisible(false);
          markIntroDone();
        }}
      >
        <div data-door-l className="absolute inset-y-0 left-0 w-1/2 bg-bg" />
        <div data-door-r className="absolute inset-y-0 right-0 w-1/2 bg-bg" />

        <div className="relative grid h-full place-items-center px-6">
          <div className="text-center">
            <h2
              data-brand
              className="flex flex-col items-center gap-1 text-[clamp(2rem,9vw,2.7rem)] leading-[1.05] font-semibold tracking-[0.04em] will-change-transform md:flex-row md:gap-0 md:text-[clamp(1.8rem,5vw,3.5rem)]"
            >
              <span data-line1 className="whitespace-nowrap">
                <Letters text={LINE_1} tag="data-l1" />
              </span>
              <span className="hidden w-[0.3em] md:inline-block" />
              <span className="whitespace-nowrap">
                <Letters text={LINE_2} tag="data-l2" />
              </span>
            </h2>
            <p
              data-tagline
              className="mx-auto mt-6 max-w-[95vw] font-mono text-[clamp(0.68rem,1.5vw,0.9rem)] tracking-[0.22em] text-balance text-muted uppercase opacity-0"
            >
              {site.tagline}
            </p>
          </div>
        </div>

        <p data-meta data-counter className="absolute right-6 bottom-12 font-mono text-sm tracking-[0.1em] opacity-0 sm:right-12">
          000
        </p>
        <div data-meta className="absolute inset-x-6 bottom-8 h-px bg-line opacity-0 sm:inset-x-12">
          <div data-fill className="h-full origin-left bg-ink" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </>
  );
}
