import type { Metadata } from "next";
import {
  FilePen,
  Image as ImageIcon,
  KeyRound,
  LogIn,
  LogOut,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  UserPlus,
  Settings,
} from "lucide-react";
import { AdminActiveToggle, ChangePasswordForm, NewAdminForm } from "@/components/panel/admin-forms";
import { Avatar, PageHero, SectionCard, StatStrip } from "@/components/panel/ui";
import { logoutEverywhereAction } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { getAdmins, getAuditLog } from "@/lib/data/admins";
import { cn, daysAgo, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Admins & log" };

/** Icon and colour for each kind of log entry. */
function kind(action: string) {
  if (action.startsWith("login.failed") || action.startsWith("login.blocked"))
    return { icon: ShieldAlert, tone: "bg-red-600/15 text-red-700 dark:text-red-300" };
  if (action.startsWith("login")) return { icon: LogIn, tone: "bg-sage/15 text-sage" };
  if (action.startsWith("logout")) return { icon: LogOut, tone: "bg-surface-2 text-muted" };
  if (action.includes("deleted")) return { icon: Trash2, tone: "bg-red-600/10 text-red-700 dark:text-red-300" };
  if (action.startsWith("product")) return { icon: Package, tone: "bg-accent/15 text-accent" };
  if (action.startsWith("order")) return { icon: ShoppingCart, tone: "bg-accent/15 text-accent" };
  if (action.startsWith("post") || action.startsWith("content")) return { icon: FilePen, tone: "bg-accent/15 text-accent" };
  if (action.startsWith("image")) return { icon: ImageIcon, tone: "bg-accent/15 text-accent" };
  if (action.startsWith("admin")) return { icon: UserPlus, tone: "bg-accent/15 text-accent" };
  if (action.startsWith("password")) return { icon: KeyRound, tone: "bg-accent/15 text-accent" };
  return { icon: Settings, tone: "bg-surface-2 text-muted" };
}

/** "content.home.saved" -> "Content · home saved" */
const human = (action: string) => {
  const [first, ...rest] = action.split(".");
  return `${first.charAt(0).toUpperCase()}${first.slice(1)} · ${rest.join(" ")}`;
};

export default async function AdminsPage() {
  const me = await requireAdmin();
  const [admins, log] = await Promise.all([getAdmins(), getAuditLog()]);
  const dayAgo = daysAgo(1);
  const failed24h = log.filter((l) => l.action.startsWith("login.failed") && new Date(l.at).getTime() >= dayAgo).length;
  const changes = log.filter((l) => !l.action.startsWith("login") && !l.action.startsWith("logout")).length;

  return (
    <div className="rise">
      <PageHero
        icon={ShieldCheck}
        eyebrow="Security"
        title="Who holds"
        accent="the keys"
        description="Admin accounts are separate from shop customers. Only the people listed here can sign in to this panel, and every sign-in and change is recorded."
      />

      <StatStrip
        items={[
          { label: "Admins", value: admins.length, tone: "accent" },
          { label: "Active", value: admins.filter((a) => a.active).length, tone: "good" },
          { label: "Failed sign-ins (24 h)", value: failed24h, tone: failed24h ? "warn" : "default" },
          { label: "Recent changes", value: changes },
        ]}
      />

      <ul className="mb-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {admins.map((a) => (
          <li key={a.id} className={cn("sheen rounded-card bg-surface p-5 ring-1 ring-line", !a.active && "opacity-60")}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={a.name} className="size-12 text-sm" />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold tracking-tight">
                    {a.name}
                    {a.id === me.id && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 align-middle text-[0.65rem] font-medium text-accent">You</span>}
                  </p>
                  <p className="truncate text-sm text-muted">
                    @{a.username} · {a.email}
                  </p>
                </div>
              </div>
              {a.id !== me.id && <AdminActiveToggle id={a.id} active={a.active} name={a.name} />}
            </div>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              {a.lastLoginAt ? (
                <>
                  Last sign-in {formatDateTime(a.lastLoginAt)}
                  {a.lastLoginIp && <span className="font-mono"> · {a.lastLoginIp}</span>}
                </>
              ) : (
                "Never signed in"
              )}
            </p>
          </li>
        ))}
      </ul>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <SectionCard icon={UserPlus} title="Add an admin" description="They can do everything you can. Only add people you trust.">
          <NewAdminForm />
        </SectionCard>

        <SectionCard icon={KeyRound} title="Your password" description="Changing it signs you out on every other device.">
          <ChangePasswordForm />
          <form action={logoutEverywhereAction} className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 p-4">
            <p className="text-sm text-muted">Lost a device or left yourself signed in somewhere?</p>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium transition hover:border-accent/50 hover:text-accent"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out everywhere
            </button>
          </form>
        </SectionCard>
      </div>

      <SectionCard icon={ShieldCheck} title="Activity log" description={`The latest ${log.length} sign-ins and changes. Entries are kept for 180 days.`}>
        <ol className="relative space-y-1 before:absolute before:top-2 before:bottom-2 before:left-[1.05rem] before:w-px before:bg-line">
          {log.map((entry) => {
            const { icon: Icon, tone } = kind(entry.action);
            return (
              <li key={entry.id} className="relative flex items-start gap-3 rounded-xl px-1 py-2 transition hover:bg-surface-2">
                <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-[var(--surface-solid)]", tone)}>
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{entry.username || "Someone"}</span>{" "}
                    <span className="text-muted">{human(entry.action)}</span>
                    {entry.target && <span className="ml-1 font-medium">“{entry.target}”</span>}
                  </p>
                  <p className="font-mono text-[0.68rem] text-muted">
                    {formatDateTime(entry.at)} · {entry.ip}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </SectionCard>
    </div>
  );
}
