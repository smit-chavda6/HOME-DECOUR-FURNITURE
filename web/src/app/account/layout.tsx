import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, Package, Settings } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Your account", template: "%s | Home Decor Furniture" },
  robots: { index: false },
};

const linkStyles =
  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-2";

/** The greeting depends on who is signed in, so it streams in. */
async function AccountIdentity() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <>
      <p className="px-4 text-sm text-muted">Signed in as</p>
      <p className="truncate px-4 font-display text-xl">{user.fullName}</p>
    </>
  );
}

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-10 py-10 sm:py-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Suspense fallback={<div className="mx-4 h-12 animate-pulse rounded bg-surface-2" />}>
          <AccountIdentity />
        </Suspense>

        <nav aria-label="Account" className="mt-4 flex gap-1 overflow-x-auto lg:block lg:space-y-1">
          <Link href="/account" className={linkStyles}>
            <Settings className="size-4" aria-hidden />
            Profile
          </Link>
          <Link href="/account/orders" className={linkStyles}>
            <Package className="size-4" aria-hidden />
            Orders
          </Link>
          <form action={logoutAction}>
            <button type="submit" className={`${linkStyles} w-full text-left text-muted`}>
              <LogOut className="size-4" aria-hidden />
              Log out
            </button>
          </form>
        </nav>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
