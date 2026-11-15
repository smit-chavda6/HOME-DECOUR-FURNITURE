import { ExternalLink, LogOut } from "lucide-react";
import { BrandMark, BrandName } from "@/components/panel/brand";
import { SideNav } from "@/components/panel/side-nav";
import { Avatar } from "@/components/panel/ui";
import { logoutAction } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { shopUrl } from "@/lib/utils";

/** Frame for every signed-in page: white sidebar, top bar, then the page on the warm-grey canvas. */
export default async function PanelLayout({ children }: LayoutProps<"/">) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="z-20 border-b border-line bg-surface lg:sticky lg:top-0 lg:h-svh lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-4 py-4 lg:px-5 lg:pt-6 lg:pb-6">
            <BrandMark className="size-9 text-ink" />
            <BrandName />
          </div>
          <SideNav />
          <div className="mt-auto hidden border-t border-line p-4 lg:block">
            <a
              href={shopUrl("/")}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-sm transition hover:bg-accent-soft"
            >
              <span>
                <span className="block font-medium">View the shop</span>
                <span className="block text-xs text-muted">Opens in a new tab</span>
              </span>
              <ExternalLink className="size-4 text-muted transition group-hover:text-accent" aria-hidden />
            </a>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-line bg-[rgb(246_245_242/0.85)] backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
            <p className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 ring-1 ring-line">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-sage" style={{ animation: "pulse-dot 2.4s ease-out infinite" }} />
                <span className="relative size-2 rounded-full bg-sage" />
              </span>
              Shop is live
            </p>
            <div className="flex items-center gap-3">
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-sm font-medium">{admin.name}</span>
                <span className="block text-xs text-muted">@{admin.username}</span>
              </span>
              <Avatar name={admin.name} className="size-9 ring-0" />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-ink-2 shadow-[var(--shadow-sm)] transition hover:border-line-strong hover:text-ink"
                >
                  <LogOut className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="rise mx-auto max-w-[96rem] px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
