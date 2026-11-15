import { cn } from "@/lib/utils";

/** The shop's window mark (same geometry as web/src/components/layout/logo-mark.tsx). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-8 shrink-0", className)} aria-hidden fill="none">
      <defs>
        <linearGradient id="adm-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3cf9e" />
          <stop offset="1" stopColor="#e3a56f" />
        </linearGradient>
      </defs>
      <path d="M11.5 11.5h10v10h-10z" fill="url(#adm-sun)" />
      <path
        d="M12 7h24a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V12a5 5 0 0 1 5-5z"
        stroke="currentColor"
        strokeWidth="3.4"
      />
      <path d="M24 7v34M7 24h34" stroke="currentColor" strokeWidth="2.7" />
    </svg>
  );
}

/** "Home Decor" wordmark with an "Admin" tag. */
export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="font-display text-[1.1rem] font-semibold tracking-[-0.035em]">
        Home{" "}
        <em className="text-gradient pr-[0.06em] font-serif text-[1.08em] font-normal italic">
          Decor
        </em>
      </span>
      <span className="mt-1 font-mono text-[0.52rem] tracking-[0.36em] text-muted uppercase">Admin panel</span>
    </span>
  );
}
