import { cn } from "@/lib/utils";

/**
 * The Home Decor monogram: a geometric "HD". The H and the D share their
 * centre stroke, like two rooms sharing a wall. Square ends, one stroke
 * weight, and a single copper crossbar as the only accent.
 *
 * The paths are exported so the intro loader can draw the same mark, and the
 * favicon/app icons (app/icon.svg, scripts/brand) use the same geometry.
 */
export const MARK = {
  /** H stems and the shared wall, plus the D bowl. */
  frame: "M10 9V39M24 9V39M24 9h4a11 11 0 0 1 11 11v8a11 11 0 0 1-11 11h-4",
  /** The H crossbar, drawn in the accent colour. */
  bar: "M10 24H24",
  stroke: 3.2,
} as const;

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-8 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d={MARK.frame} stroke="currentColor" strokeWidth={MARK.stroke} />
      <path d={MARK.bar} stroke="var(--accent, #e3a56f)" strokeWidth={MARK.stroke} />
    </svg>
  );
}
