"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Banner } from "@/lib/data/content";

const DISMISS_KEY = "hdf-banner-dismissed";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

/**
 * Shown only in the browser, after checking today's date against the
 * banner's start and end dates (the page itself is cached for hours).
 * Visitors can close it for the rest of their visit.
 */
export function AnnouncementBarClient({ banner }: { banner: Banner }) {
  const hydrated = useHydrated();
  const [closed, setClosed] = useState(false);

  if (!hydrated || closed) return null;
  const now = today();
  if ((banner.startsAt && now < banner.startsAt) || (banner.endsAt && now > banner.endsAt)) return null;
  // Closing remembers this exact message, so a new announcement shows again.
  if (readDismissed() === banner.text) return null;

  const external = /^https?:\/\//.test(banner.href);

  return (
    <div className="relative z-50 bg-accent text-accent-ink">
      <div className="container-page flex min-h-10 items-center justify-center gap-3 py-2 pr-10 text-center text-sm">
        <p>
          {banner.text}
          {banner.href && (
            <>
              {" "}
              {external ? (
                <a href={banner.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-4">
                  {banner.linkLabel || "Learn more"}
                  <ArrowRight className="size-3.5" aria-hidden />
                </a>
              ) : (
                <Link href={banner.href} className="inline-flex items-center gap-1 font-semibold underline underline-offset-4">
                  {banner.linkLabel || "Learn more"}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              )}
            </>
          )}
        </p>
        <button
          type="button"
          aria-label="Close announcement"
          onClick={() => {
            try {
              sessionStorage.setItem(DISMISS_KEY, banner.text);
            } catch {
              // Storage blocked: just hide it for now.
            }
            setClosed(true);
          }}
          className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full hover:bg-black/10"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
