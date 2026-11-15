import { Suspense } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { site } from "@/lib/site";
import { CartButton } from "@/components/cart/cart-button";
import { LogoMark, Wordmark } from "./logo-mark";
import { MobileNav } from "./mobile-nav";
import { NavLinks, NavLinksFallback } from "./nav-links";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";
import { WishlistLink } from "./wishlist-link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} home`}
      className={className ?? "flex items-center gap-2.5"}
    >
      <LogoMark className="size-8 text-ink" />
      <Wordmark />
    </Link>
  );
}

/** Floating glass navigation bar. */
export function Header() {
  return (
    <header className="pointer-events-none sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="glass-strong pointer-events-auto mx-auto flex h-14 max-w-[84rem] items-center justify-between gap-3 rounded-full pr-2 pl-3 shadow-[var(--shadow)] sm:pl-5">
        <div className="flex items-center gap-1">
          <MobileNav />
          <Logo />
        </div>

        <nav aria-label="Main" className="hidden md:block">
          {/* The active link depends on the URL, which is only known per request. */}
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-0.5">
          <SearchDialog />
          <ThemeToggle />
          <WishlistLink />
          <Link
            href="/account"
            aria-label="Your account"
            className={buttonStyles({
              variant: "ghost",
              size: "icon",
              className: "hidden sm:inline-flex",
            })}
          >
            <User aria-hidden />
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
