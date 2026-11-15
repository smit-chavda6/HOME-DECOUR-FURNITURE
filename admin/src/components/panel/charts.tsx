"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("en-IN");
const fmt = (v: number, kind: "inr" | "int") => (kind === "inr" ? inr.format(v) : int.format(v));
const dayLabel = (iso: string, long = false) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", ...(long ? { weekday: "short" } : {}), timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

const noop = () => () => {};
/** False during server render and hydration, true afterwards. */
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** A number that counts up from zero when it first appears. */
export function CountUp({ value, kind = "int", className }: { value: number; kind?: "inr" | "int"; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || value === 0) return;
    const start = performance.now();
    const duration = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(value * eased), kind);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, kind, reduce]);

  // The server renders the final value, so it is correct without JavaScript.
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {fmt(value, kind)}
    </span>
  );
}

/** Small decorative trend line for a stat tile (the tile states the number). */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const id = useId().replace(/:/g, "");
  const w = 120;
  const h = 36;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / Math.max(values.length - 1, 1)) * w, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const area = `${line}L${w} ${h}L0 ${h}Z`;
  const [lx, ly] = pts[pts.length - 1] ?? [w, h];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-full overflow-visible", className)} aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--series-1)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--series-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${id})`} className="fade-in" />
      <path d={line} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="fade-in" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="2.5" fill="var(--series-1)" className="fade-in" />
    </svg>
  );
}

/**
 * Revenue per day: one series as a line with a soft area under it.
 * A crosshair snaps to the nearest day under the pointer (or arrow keys when
 * focused) and a tooltip shows that day's revenue and order count.
 * Measured in real pixels (ResizeObserver) so text never stretches.
 */
export function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const id = useId().replace(/:/g, "");
  const mounted = useMounted();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = 240;
  const pad = { top: 16, right: 12, bottom: 28, left: 64 };
  const iw = width - pad.left - pad.right;
  const ih = height - pad.top - pad.bottom;

  const { max, ticks } = useMemo(() => {
    const raw = Math.max(...data.map((d) => d.revenue), 0);
    if (raw === 0) return { max: 1000, ticks: [0, 500, 1000] };
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => raw / s <= 4) ?? mag * 10;
    const top = Math.ceil(raw / step) * step;
    return { max: top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
  }, [data]);

  const x = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * iw;
  const y = (v: number) => pad.top + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.revenue).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1)} ${pad.top + ih}L${x(0)} ${pad.top + ih}Z`;
  const short = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(v % 100000 ? 1 : 0)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);

  const pick = (clientX: number) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = (clientX - rect.left - pad.left) / iw;
    setActive(Math.min(data.length - 1, Math.max(0, Math.round(rel * (data.length - 1)))));
  };
  const a = active !== null ? data[active] : null;
  const labelIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <div ref={wrap} className="relative">
      <svg
        width={width}
        height={height}
        className="block touch-pan-y outline-none"
        role="img"
        aria-label={`Revenue per day for the last ${data.length} days. Use left and right arrow keys to read each day.`}
        tabIndex={0}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((v) => v ?? data.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setActive((v) => Math.max(0, (v ?? data.length) - 1));
          if (e.key === "ArrowRight") setActive((v) => Math.min(data.length - 1, (v ?? -1) + 1));
        }}
      >
        <defs>
          <linearGradient id={`rv-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--series-1)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--series-1)" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`rc-${id}`}>
            <rect x={pad.left} y="0" width={mounted ? iw + 4 : 0} height={height} style={{ transition: "width 1.4s cubic-bezier(0.65,0,0.35,1)" }} />
          </clipPath>
        </defs>

        {/* recessive grid and y labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth="1" />
            <text x={pad.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--muted)] font-mono text-[10px]">
              {short(t)}
            </text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-[var(--muted)] font-mono text-[10px]">
            {dayLabel(data[i].date)}
          </text>
        ))}

        <g clipPath={`url(#rc-${id})`}>
          <path d={area} fill={`url(#rv-${id})`} />
          <path d={line} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </g>

        {a && active !== null && (
          <g pointerEvents="none">
            <line x1={x(active)} x2={x(active)} y1={pad.top} y2={pad.top + ih} stroke="var(--muted)" strokeOpacity="0.5" strokeDasharray="3 3" />
            <circle cx={x(active)} cy={y(a.revenue)} r="5" fill="var(--series-1)" stroke="var(--surface-solid)" strokeWidth="2" />
          </g>
        )}
      </svg>

      {a && active !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-xl border border-line bg-surface-solid/95 px-3 py-2 text-sm shadow-lg"
          style={{
            // beside the crosshair, on whichever side has room, so the point stays visible
            left: x(active) > width / 2 ? Math.max(x(active) - 166, 0) : Math.min(x(active) + 14, width - 152),
          }}
        >
          <p className="font-display text-base font-semibold tabular-nums">{inr.format(a.revenue)}</p>
          <p className="flex items-center gap-2 text-xs text-muted">
            <span className="h-0.5 w-3 rounded bg-[var(--series-1)]" aria-hidden />
            Revenue · {a.orders} {a.orders === 1 ? "order" : "orders"}
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-wider text-muted uppercase">{dayLabel(a.date, true)}</p>
        </div>
      )}
    </div>
  );
}

/** Orders per status as horizontal bars, each directly labelled with its count. */
export function StatusBars({ rows }: { rows: { label: string; value: number; href: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const mounted = useMounted();
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label}>
          <a href={r.href} className="group grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
            <span className="truncate text-muted transition-colors group-hover:text-ink">{r.label}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full bg-[var(--series-1)] transition-[width,filter] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:brightness-125"
                style={{ width: mounted ? `${Math.max((r.value / max) * 100, r.value ? 4 : 0)}%` : "0%", transitionDelay: `${i * 80}ms` }}
              />
            </span>
            <span className="text-right font-medium tabular-nums">{r.value}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Greeting with the sun's place in today's sky: an arc from 6 am to 7 pm
 * (India time) with the sun where it is now, or a moon at night.
 */
export function SunArc({ name }: { name: string }) {
  const mounted = useMounted();
  const now = mounted ? new Date() : null;
  const parts = now
    ? new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" })
        .formatToParts(now)
        .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {})
    : null;
  const hours = parts ? Number(parts.hour) + Number(parts.minute) / 60 : 12;
  const greeting = !mounted ? "Hello" : hours < 12 ? "Good morning" : hours < 17 ? "Good afternoon" : "Good evening";
  const day = hours >= 6 && hours <= 19;
  const p = Math.min(Math.max((hours - 6) / 13, 0), 1);
  const angle = Math.PI * (1 - p);
  const cx = 110 + Math.cos(angle) * 90;
  const cy = 100 - Math.sin(angle) * 80;
  const dateText = now
    ? new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(now)
    : " ";

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="eyebrow">{dateText}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting}, <span className="text-gradient font-serif font-normal italic">{name}</span>
        </h1>
      </div>
      <svg viewBox="0 0 220 114" className="hidden h-24 w-48 shrink-0 sm:block" aria-hidden>
        <defs>
          <radialGradient id="sun-glow">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M20 100A90 80 0 0 1 200 100" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="3 5" />
        <path
          d="M20 100A90 80 0 0 1 200 100"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={mounted && day ? 1 - p : 1}
          style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.65,0,0.35,1)" }}
        />
        <line x1="8" x2="212" y1="100" y2="100" stroke="var(--line)" strokeWidth="1.5" />
        {mounted &&
          (day ? (
            <g className="fade-in">
              <circle cx={cx} cy={cy} r="22" fill="url(#sun-glow)" />
              <circle cx={cx} cy={cy} r="7" fill="#f3b46f" />
            </g>
          ) : (
            <g className="fade-in">
              <circle cx="110" cy="38" r="9" fill="var(--accent-2)" />
              <circle cx="114" cy="35" r="8" fill="var(--bg)" />
            </g>
          ))}
        <text x="20" y="110" textAnchor="middle" className="fill-[var(--muted)] font-mono text-[10px]">6am</text>
        <text x="200" y="110" textAnchor="middle" className="fill-[var(--muted)] font-mono text-[10px]">7pm</text>
      </svg>
    </div>
  );
}
