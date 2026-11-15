import { ExternalLink, LogOut } from "lucide-react";
import { SideNav } from "@/components/panel/side-nav";
import { logoutAction } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { shopUrl } from "@/lib/utils";

/** Frame for every signed-in page: sidebar, top bar, then the page. */
export default async function PanelLayout({ children }: LayoutProps<"/">) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-svh lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-4 py-4 lg:px-5 lg:py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="size-8" />
          <div className="min-w-0">
            <p className="font-display leading-tight font-semibold">Home Decor</p>
            <p className="eyebrow">Admin</p>
          </div>
        </div>
        <SideNav />
      </aside>

      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-8">
          <a
            href={shopUrl("/")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            View shop
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm">
              <span className="text-muted">Signed in as </span>
              <span className="font-medium">{admin.name}</span>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-sm hover:bg-surface-2"
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
