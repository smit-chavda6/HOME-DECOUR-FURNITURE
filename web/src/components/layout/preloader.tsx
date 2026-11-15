"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "motion/react";
import { markIntroDone } from "@/hooks/use-intro-done";
import { INTRO_SEEN_KEY as SEEN_KEY } from "@/lib/inline-scripts";

const OUT = [0.16, 1, 0.3, 1] as const;
const DRAW = [0.65, 0, 0.35, 1] as const;

/** Rounded rectangle as a path, so it can be "drawn" with a dash offset. */
function rr(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

/**
 * The room as an architect's elevation drawing (viewBox 800×480). Each entry
 * is one stroke; they draw in this order.
 */
const LINES = [
  // floor and skirting
  "M20 400H796",
  "M20 392H796",
  // window: frame, mullions, sill
  rr(96, 64, 168, 300, 3),
  "M152 64V364M208 64V364M96 214H264",
  "M84 372H276",
  // abstract print
  rr(336, 118, 112, 142, 2),
  rr(350, 132, 84, 114, 1),
  "M350 190H434M392 132V246",
  // sofa: three back cushions, seat, arms, plinth
  rr(318, 272, 104, 70, 22),
  rr(424, 272, 104, 70, 22),
  rr(530, 272, 104, 70, 22),
  rr(306, 330, 340, 52, 16),
  rr(286, 300, 40, 84, 18),
  rr(626, 300, 40, 84, 18),
  "M300 384H652V392",
  // throw cushion
  "M352 300l58-6 4 40-58 6z",
  // arc lamp
  "M712 398V182C712 116 660 92 604 106",
  "M574 138a30 26 0 0 1 60 0z",
  "M690 398h44",
  // snake plant in a planter
  "M744 400l5-58h36l5 58",
  "M756 342C750 300 753 262 763 228c5 40 5 76 1 114",
  "M770 342C769 292 775 246 787 210c3 50 0 94-7 132",
  "M781 342c2-34 8-58 20-78-2 34-7 58-14 78",
];

/** Copper measurement lines with end ticks. */
const DIMENSIONS = ["M286 430H666", "M286 422V438M666 422V438", "M70 64V364", "M62 64H78M62 364H78"];

/** Sunlight falling from the window, across the wall and floor. */
const BEAMS = [
  "M152 64L264 64L560 392L380 392Z",
  "M96 214L152 214L330 392L240 392Z",
  "M208 214L264 214L640 392L520 392Z",
];

/**
 * Brand intro: the home page's room as a fine line drawing that draws
 * itself, then "turns on the sun": the window glows, warm light falls through
 * it and the brand rises underneath. The screen then lifts away from the
 * bottom, the same way the hero picture opens.
 *
 * About 3.4 seconds, shown once per browser session, skipped with a click.
 * The server renders it visible so the page never flashes underneath; the
 * head script hides it for returning visitors and reduced motion.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const stopIntro = useRef<() => void>(() => {});
  const [visible, setVisible] = useState(true);

  useEffect(() => {
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
    const q = (sel: string) => el.querySelectorAll<HTMLElement | SVGElement>(sel);
    const one = (sel: string) => el.querySelector<HTMLElement>(sel)!;
    const controls: { stop: () => void }[] = [];
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => el.isConnected && fn(), ms));
    const run = (...args: unknown[]) => {
      // animate() has many overloads; this keeps every call stoppable on unmount.
      const c = (animate as (...a: unknown[]) => { stop: () => void })(...args);
      controls.push(c);
      return c;
    };

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const stopAll = () => {
      controls.forEach((c) => c.stop());
      timers.forEach(clearTimeout);
      html.style.overflow = prevOverflow;
    };
    stopIntro.current = stopAll;

    // 1. The drawing draws itself, line by line, while the camera eases in.
    run(one("[data-scene]"), { scale: [1.06, 1], opacity: [0, 1] }, { duration: 2.6, ease: OUT });
    run(q("[data-line]"), { strokeDashoffset: [1, 0] }, { duration: 1.1, delay: stagger(0.045), ease: DRAW });
    run(q("[data-dim]"), { strokeDashoffset: [1, 0] }, { duration: 0.8, delay: stagger(0.08, { startDelay: 0.9 }), ease: DRAW });
    run(q("[data-label]"), { opacity: [0, 1] }, { duration: 0.6, delay: stagger(0.1, { startDelay: 1.3 }) });

    // 2. Sunrise: window panes glow, beams fall, lamp warms.
    run(q("[data-pane]"), { opacity: [0, 1] }, { duration: 0.9, delay: stagger(0.08, { startDelay: 1.35 }), ease: OUT });
    run(q("[data-beam]"), { opacity: [0, 1] }, { duration: 1.2, delay: stagger(0.12, { startDelay: 1.5 }), ease: OUT });
    run(one("[data-sun]"), { opacity: [0, 1] }, { duration: 1.4, delay: 1.35 });
    run(one("[data-lamp]"), { opacity: [0, 0.9] }, { duration: 1, delay: 1.7 });

    // 3. The brand.
    run(q("[data-letter]"), { y: ["110%", "0%"] }, { duration: 0.9, delay: stagger(0.04, { startDelay: 1.75 }), ease: OUT });
    run(one("[data-sub]"), { opacity: [0, 1], letterSpacing: ["0.9em", "0.5em"] }, { duration: 1, delay: 2.15, ease: OUT });

    // 4. Lift away; page entrances start together.
    at(2900, () => {
      markIntroDone();
      run(one("[data-stage]"), { y: -50, opacity: 0, scale: 1.03 }, { duration: 0.7, ease: [0.65, 0, 0.35, 1] });
      run(el, { clipPath: ["inset(0% 0% 0% 0%)", "inset(0% 0% 100% 0%)"] }, { duration: 0.9, delay: 0.05, ease: [0.65, 0, 0.35, 1] });
    });
    at(3900, () => {
      stopAll();
      setVisible(false);
    });

    return stopAll;
  }, []);

  if (!visible) return null;

  const dash = { strokeDasharray: 1, strokeDashoffset: 1 } as const;

  return (
    <>
      <style>{`.intro-done [data-preloader]{display:none}`}</style>
      <div
        ref={root}
        data-preloader
        aria-hidden
        className="fixed inset-0 z-[80] overflow-hidden bg-[#0c0a09] text-white"
        onClick={() => {
          stopIntro.current();
          setVisible(false);
          markIntroDone();
        }}
      >
        {/* Same ground as the hero: warm black, copper light, drawing-paper hairlines. */}
        <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_10%_95%,rgb(227_165_111/0.14),transparent_70%),radial-gradient(50rem_30rem_at_85%_0%,rgb(243_207_158/0.06),transparent_70%)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.03)_0_1px,transparent_1px_7rem)]" />

        <div data-stage className="relative flex h-full flex-col items-center justify-center px-5">
          <svg
            data-scene
            viewBox="0 0 800 480"
            className="w-full max-w-[44rem] overflow-visible opacity-0"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fbe9cc" />
                <stop offset="1" stopColor="#e9a46a" />
              </linearGradient>
              <linearGradient id="pl-beam" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f6d3a0" stopOpacity="0.32" />
                <stop offset="1" stopColor="#f6d3a0" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="pl-sun" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#f3c58d" stopOpacity="0.45" />
                <stop offset="1" stopColor="#f3c58d" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="pl-lamp" cx="0.5" cy="0" r="0.9">
                <stop offset="0" stopColor="#ffe3b5" stopOpacity="0.5" />
                <stop offset="1" stopColor="#ffe3b5" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* light (behind the drawing) */}
            <ellipse data-sun cx="180" cy="214" rx="260" ry="220" fill="url(#pl-sun)" style={{ opacity: 0 }} />
            {[0, 1, 2].flatMap((c) =>
              [0, 1].map((r) => (
                <rect
                  key={`${c}${r}`}
                  data-pane
                  x={98 + c * 56}
                  y={66 + r * 150}
                  width={52}
                  height={146}
                  fill="url(#pl-sky)"
                  opacity={0}
                  style={{ opacity: 0 }}
                />
              )),
            )}
            {BEAMS.map((d) => (
              <path key={d} data-beam d={d} fill="url(#pl-beam)" style={{ opacity: 0 }} />
            ))}
            <path data-lamp d="M574 138L540 392H670L634 138Z" fill="url(#pl-lamp)" style={{ opacity: 0 }} />

            {/* the drawing */}
            <g stroke="#efe4d2" strokeWidth={1.6} strokeOpacity={0.9}>
              {LINES.map((d, i) => (
                <path key={i} data-line d={d} pathLength={1} style={dash} />
              ))}
            </g>
            <g stroke="#e3a56f" strokeWidth={1.2}>
              {DIMENSIONS.map((d) => (
                <path key={d} data-dim d={d} pathLength={1} style={dash} />
              ))}
            </g>
            <g fill="#e3a56f" fontFamily="var(--font-mono-face), monospace" fontSize="11" letterSpacing="2">
              <text data-label x="476" y="456" textAnchor="middle" style={{ opacity: 0 }}>
                W 220 CM
              </text>
              <text data-label x="54" y="214" textAnchor="middle" transform="rotate(-90 54 214)" style={{ opacity: 0 }}>
                H 240 CM
              </text>
              <text data-label x="796" y="40" textAnchor="end" fill="#efe4d2" fillOpacity="0.55" style={{ opacity: 0 }}>
                LIVING ROOM · ELEVATION A
              </text>
            </g>
          </svg>

          <p className="mt-6 font-display text-[clamp(2.4rem,7vw,4.2rem)] leading-none font-semibold tracking-[-0.045em] sm:mt-8">
            {"Home".split("").map((ch, i) => (
              <span key={i} className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
                <span data-letter className="inline-block" style={{ transform: "translateY(110%)" }}>
                  {ch}
                </span>
              </span>
            ))}{" "}
            <em className="font-serif text-[1.08em] font-normal tracking-[-0.01em] italic">
              {"Decor".split("").map((ch, i) => (
                <span key={i} className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
                  <span data-letter className="text-gradient inline-block pr-[0.06em]" style={{ transform: "translateY(110%)" }}>
                    {ch}
                  </span>
                </span>
              ))}
            </em>
          </p>
          <p data-sub className="mt-4 font-mono text-[0.68rem] tracking-[0.5em] text-white/55 uppercase opacity-0">
            Furniture
          </p>
        </div>
      </div>
    </>
  );
}
