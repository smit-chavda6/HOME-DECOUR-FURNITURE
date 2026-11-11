"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { mainNav, site } from "@/lib/site";

const extraLinks = [
  { label: "Wishlist", href: "/wishlist" },
  { label: "Account", href: "/account" },
  { label: "FAQ", href: "/faq" },
];

/** Slide-in menu for small screens. Hidden from md upwards. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open menu"
        className={buttonStyles({
          variant: "ghost",
          size: "icon",
          className: "-ml-2 md:hidden",
        })}
      >
        <Menu aria-hidden />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-surface p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-xl font-semibold">
              {site.name}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close menu"
              className={buttonStyles({ variant: "ghost", size: "icon" })}
            >
              <X aria-hidden />
            </Dialog.Close>
          </div>

          <nav aria-label="Mobile" className="mt-8">
            <ul className="space-y-1">
              {[...mainNav, ...extraLinks].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-3 font-display text-2xl transition-colors hover:bg-surface-2"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="mt-auto text-sm text-muted">{site.tagline}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
