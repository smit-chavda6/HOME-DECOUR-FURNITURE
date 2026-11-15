"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { ArrowRight, Search, X } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { categories } from "@/lib/site";

/** Search icon in the header. Opens a panel with a search box and category shortcuts. */
export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    setOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Search furniture"
        className={buttonStyles({ variant: "ghost", size: "icon" })}
      >
        <Search aria-hidden />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 top-0 z-50 border-b border-line bg-surface shadow-2xl"
        >
          <div className="container-page py-6 sm:py-8">
            <div className="flex items-center justify-between">
              <Dialog.Title className="eyebrow">Search</Dialog.Title>
              <Dialog.Close
                aria-label="Close search"
                className={buttonStyles({ variant: "ghost", size: "icon" })}
              >
                <X aria-hidden />
              </Dialog.Close>
            </div>

            <form onSubmit={onSubmit} role="search" className="mt-2 flex items-center gap-3 border-b-2 border-ink pb-3">
              <Search className="size-6 shrink-0 text-muted" aria-hidden />
              <input
                name="q"
                type="search"
                autoFocus
                autoComplete="off"
                maxLength={60}
                placeholder="Sofa, oak, velvet…"
                aria-label="Search furniture"
                className="min-w-0 flex-1 bg-transparent font-display text-2xl placeholder:text-muted/60 focus:outline-none sm:text-4xl"
              />
              <button
                type="submit"
                aria-label="Search"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink"
              >
                <ArrowRight className="size-5" aria-hidden />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-muted">Browse:</span>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop?category=${category.slug}`}
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-line px-4 py-1.5 text-sm transition-colors hover:border-ink"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
