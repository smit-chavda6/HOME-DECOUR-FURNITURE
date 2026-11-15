"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";

/** Shown when a page fails to load, for example if the database is unreachable. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-page flex flex-col items-center py-28 text-center lg:py-40">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">We could not load this page</h1>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
        This is usually temporary. Please try again in a moment.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          <RotateCcw aria-hidden />
          Try again
        </Button>
        <Link href="/" className={buttonStyles({ variant: "outline", size: "lg" })}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
