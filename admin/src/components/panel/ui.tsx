import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for every admin page in the light theme: a page
 * header, number strips, avatars, empty states and section cards.
 * Server-safe (no client JavaScript).
 */

/** A faint dot grid with a terracotta corner glow, behind page headers. */
function HeaderPattern() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[46%] md:block" preserveAspectRatio="none">
      <defs>
        <pattern id="hdr-dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.1" fill="#111" fillOpacity="0.07" />
        </pattern>
        <linearGradient id="hdr-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hdr-glow" cx="1" cy="0" r="0.9">
          <stop offset="0" stopColor="#ea580c" stopOpacity="0.12" />
          <stop offset="1" stopColor="#ea580c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hdr-dots)" />
      <rect width="100%" height="100%" fill="url(#hdr-glow)" />
      <rect width="60%" height="100%" fill="url(#hdr-fade)" />
    </svg>
  );
}

/**
 * The header at the top of every page: icon, eyebrow, a title whose last
 * words can be set in the terracotta italic accent, a description, and
 * actions on the right.
 */
export function PageHero({
  icon: Icon,
  eyebrow,
  title,
  accent,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  /** Words shown after the title in the terracotta italic serif. */
  accent?: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative mb-6 overflow-hidden rounded-[1.25rem] border border-line bg-surface px-6 py-6 shadow-[var(--shadow-card)] sm:px-8 sm:py-7",
        className,
      )}
    >
      <HeaderPattern />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/15">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-1 font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[2.1rem]">
              {title}
              {accent && (
                <>
                  {" "}
                  <span className="pr-[0.05em] font-serif font-normal text-accent italic">{accent}</span>
                </>
              )}
            </h1>
            {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
          </div>
        </div>
        {children && <div className="relative flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

/** A row of small figures under a page header. */
export function StatStrip({
  items,
}: {
  items: { label: string; value: React.ReactNode; tone?: "default" | "accent" | "good" | "warn" }[];
}) {
  const bar = { default: "bg-line-strong", accent: "bg-accent", good: "bg-sage", warn: "bg-warn" };
  return (
    <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="relative overflow-hidden rounded-card border border-line bg-surface px-4 py-3.5 shadow-[var(--shadow-sm)]">
          <span className={cn("absolute inset-y-3 left-0 w-[3px] rounded-r-full", bar[it.tone ?? "default"])} aria-hidden />
          <dt className="text-xs font-medium text-muted">{it.label}</dt>
          <dd className="mt-1 font-display text-2xl font-semibold tracking-tight tabular-nums">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const AVATAR_TONES = [
  "bg-[#fde7da] text-[#9a3412]",
  "bg-[#dcfce7] text-[#166534]",
  "bg-[#e0e7ff] text-[#3730a3]",
  "bg-[#fef3c7] text-[#92400e]",
  "bg-[#fce7f3] text-[#9d174d]",
  "bg-[#e0f2fe] text-[#075985]",
];

/** Initials in a soft pastel circle; the colour is stable per name. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials =
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold ring-2 ring-white",
        AVATAR_TONES[hash % AVATAR_TONES.length],
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** Friendly empty state with a small line drawing of a room. */
export function EmptyState({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[1.25rem] border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <svg viewBox="0 0 160 100" className="h-24 w-auto" fill="none" aria-hidden>
        <g stroke="#9a9893" strokeWidth="1.4" strokeLinecap="round">
          <path d="M10 86h140" />
          <rect x="22" y="14" width="44" height="60" rx="2" />
          <path d="M44 14v60M22 44h44" />
          <path d="M120 86V40c0-14-12-22-24-18" />
          <path d="M84 30a12 10 0 0 1 24 0z" />
        </g>
        <rect x="24" y="16" width="18" height="26" fill="#c2410c" fillOpacity="0.18" />
        <path d="M84 30l-8 56h40l-8-56z" fill="#ea580c" fillOpacity="0.08" />
      </svg>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/** A titled card section used inside forms and detail pages. */
export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card bg-surface p-5 ring-1 ring-line sm:p-6", className)}>
      {title && (
        <div className="mb-5 flex items-start gap-3">
          {Icon && (
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
              <Icon className="size-4" aria-hidden />
            </span>
          )}
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}
