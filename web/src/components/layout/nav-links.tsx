"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";

const linkStyles =
  "relative block rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-ink";

/** Desktop navigation. A glass pill slides under the current section. */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center">
      {mainNav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(linkStyles, active ? "text-ink" : "text-muted")}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-ink/[0.08]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Same links without highlighting, shown while the real ones load. */
export function NavLinksFallback() {
  return (
    <ul className="flex items-center">
      {mainNav.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className={cn(linkStyles, "text-muted")}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
