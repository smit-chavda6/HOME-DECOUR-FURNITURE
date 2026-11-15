"use client";

import { Clock } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

/** Showroom hours in Ahmedabad (IST). Hours are 24h; null means closed. */
const HOURS: { label: string; days: number[]; open: number | null; close: number | null; text: string }[] = [
  { label: "Monday to Friday", days: [1, 2, 3, 4, 5], open: 9, close: 20, text: "9:00 AM – 8:00 PM" },
  { label: "Saturday", days: [6], open: 10, close: 18, text: "10:00 AM – 6:00 PM" },
  { label: "Sunday", days: [0], open: null, close: null, text: "Closed" },
];

/** Current day (0 = Sunday) and fractional hour in India, whatever the visitor's time zone. */
function nowInIndia() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, hour: Number(get("hour")) + Number(get("minute")) / 60 };
}

function fmt(h: number) {
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1} ${suffix}`;
}

/** Live "open now" status with today's row highlighted. Neutral until hydrated. */
export function OpeningHours() {
  const hydrated = useHydrated();
  const now = hydrated ? nowInIndia() : null;
  const today = now ? HOURS.find((h) => h.days.includes(now.day)) : null;
  const open = !!(now && today?.open != null && now.hour >= today.open && now.hour < today.close!);

  let status = "Showroom hours";
  if (now && today) {
    if (open) status = `Open now · closes ${fmt(today.close!)}`;
    else if (today.open != null && now.hour < today.open) status = `Closed · opens ${fmt(today.open)} today`;
    else status = "Closed now";
  }

  return (
    <div className="rounded-panel bg-surface p-6 ring-1 ring-line">
      {/* Wraps the badge under the title when the sidebar is narrow, instead of squashing both. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold whitespace-nowrap">
          <Clock className="size-5 text-accent" aria-hidden />
          Opening hours
        </h2>
        <span
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-500",
            open ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-surface-2 text-muted",
          )}
        >
          <span className="relative flex size-2">
            {open && <span className="ping-soft absolute inset-0 rounded-full bg-emerald-500" />}
            <span className={cn("relative size-2 rounded-full", open ? "bg-emerald-500" : "bg-muted/60")} />
          </span>
          {status}
        </span>
      </div>
      <dl className="mt-5 space-y-1 text-sm">
        {HOURS.map((h) => {
          const isToday = h === today;
          return (
            <div
              key={h.label}
              className={cn(
                "flex justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors duration-500",
                isToday && "bg-surface-2",
              )}
            >
              <dt className={cn(isToday ? "font-medium text-ink" : "text-muted")}>
                {h.label}
                {isToday && <span className="ml-2 text-xs text-accent">Today</span>}
              </dt>
              <dd className="tabular-nums">{h.text}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
