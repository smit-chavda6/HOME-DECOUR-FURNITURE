"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Log in / Create account switch. Each is its own page, so the pill slides in
 * from the tab you came from when the new page mounts.
 */
export function AuthTabs({ mode }: { mode: "login" | "register" }) {
  const reduce = useReducedMotion();
  const next = useSearchParams().get("next");
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  const tabs = [
    { key: "login", label: "Log in", href: `/login${q}` },
    { key: "register", label: "Create account", href: `/register${q}` },
  ] as const;

  return (
    <nav aria-label="Account" className="relative grid grid-cols-2 rounded-full bg-surface-2 p-1 ring-1 ring-line">
      <motion.span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-surface shadow-sm ring-1 ring-line"
        initial={reduce ? false : { x: mode === "login" ? "100%" : "0%" }}
        animate={{ x: mode === "login" ? "0%" : "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      />
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          replace
          aria-current={t.key === mode ? "page" : undefined}
          className={cn(
            "relative z-10 rounded-full py-2.5 text-center text-sm font-medium transition-colors duration-300",
            t.key === mode ? "text-ink" : "text-muted hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
