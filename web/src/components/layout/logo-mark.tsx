import { cn } from "@/lib/utils";

/**
 * The Home Decor mark: a black steel window with one pane lit by the sun,
 * the same window that lights the room in the home page hero. It stands for
 * the store's promise: see the piece in your own room, in your own light.
 *
 * The geometry is exported so the intro loader can draw the same mark, and
 * the favicon/app icons (app/icon.svg, scripts/brand/icons.mjs) match it.
 */
export const MARK = {
  /** Outer frame (rounded square) and the cross of mullions. */
  frame: "M12 7h24a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V12a5 5 0 0 1 5-5z",
  mullions: "M24 7v34M7 24h34",
  /** The sunlit pane (top left). */
  pane: "M11.5 11.5h10v10h-10z",
  stroke: 3.4,
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
    >
      <defs>
        <linearGradient id="hd-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3cf9e" />
          <stop offset="1" stopColor="#e3a56f" />
        </linearGradient>
      </defs>
      <path d={MARK.pane} fill="url(#hd-sun)" />
      <path d={MARK.frame} stroke="currentColor" strokeWidth={MARK.stroke} />
      <path d={MARK.mullions} stroke="currentColor" strokeWidth={MARK.stroke * 0.8} />
    </svg>
  );
}

/**
 * "Home Decor" set like the site's headlines: the display face, with "Decor"
 * in the copper italic serif used for accent words, and a small "Furniture"
 * line underneath.
 */
export function Wordmark({
  className,
  sub = true,
  tone = "ink",
}: {
  className?: string;
  sub?: boolean;
  tone?: "ink" | "white";
}) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-display text-[1.15rem] font-semibold tracking-[-0.035em]",
          tone === "white" ? "text-white" : "text-ink",
        )}
      >
        Home{" "}
        <em className="text-gradient pr-[0.08em] font-serif text-[1.08em] font-normal tracking-[-0.01em] italic">
          Decor
        </em>
      </span>
      {sub && (
        <span
          className={cn(
            "mt-1 font-mono text-[0.5rem] tracking-[0.42em] uppercase",
            tone === "white" ? "text-white/55" : "text-muted",
          )}
        >
          Furniture
        </span>
      )}
    </span>
  );
}
