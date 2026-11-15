import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { AdminActiveToggle, ChangePasswordForm, NewAdminForm } from "@/components/panel/admin-forms";
import { PageTitle } from "@/components/panel/page-title";
import { logoutEverywhereAction } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { getAdmins, getAuditLog } from "@/lib/data/admins";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Admins & log" };

const tone = (action: string) =>
  action.startsWith("login.failed") || action.startsWith("login.blocked")
    ? "text-red-700 dark:text-red-400"
    : action.startsWith("login") || action.startsWith("logout")
      ? "text-muted"
      : "";

export default async function AdminsPage() {
  const me = await requireAdmin();
  const [admins, log] = await Promise.all([getAdmins(), getAuditLog()]);

  return (
    <div className="space-y-14">
      <PageTitle
        title="Admins & log"
        description="Admin accounts are separate from shop customers. Only people listed here can sign in to this panel."
      />

      <section>
        <h2 className="font-display text-xl font-semibold">Admins</h2>
        <div className="mt-4 relative overflow-x-auto rounded-card ring-1 ring-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-surface-2 text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Last sign-in</th>
                <th className="px-4 py-3 font-semibold">Can sign in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted">@{a.username}</p>
                  </td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3 text-muted">
                    {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "Never"}
                    {a.lastLoginIp && <span className="block text-xs">{a.lastLoginIp}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {a.id === me.id ? (
                      <span className="text-xs text-muted">You</span>
                    ) : (
                      <AdminActiveToggle id={a.id} active={a.active} name={a.name} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="rounded-card bg-surface p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-display text-xl font-semibold">Add an admin</h2>
          <p className="mt-1 text-sm text-muted">They can do everything you can. Only add people you trust.</p>
          <div className="mt-5">
            <NewAdminForm />
          </div>
        </section>

        <section className="rounded-card bg-surface p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-display text-xl font-semibold">Your password</h2>
          <p className="mt-1 text-sm text-muted">Changing it signs you out on every other device.</p>
          <div className="mt-5">
            <ChangePasswordForm />
          </div>
          <form action={logoutEverywhereAction} className="mt-8 border-t border-line pt-6">
            <p className="text-sm text-muted">Lost a device or left yourself signed in somewhere?</p>
            <button
              type="submit"
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium hover:bg-surface-2"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out everywhere
            </button>
          </form>
        </section>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold">Activity log</h2>
        <p className="mt-1 text-sm text-muted">The latest {log.length} sign-ins and changes. Entries are kept for 180 days.</p>
        <div className="mt-4 relative overflow-x-auto rounded-card ring-1 ring-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-surface-2 text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">What</th>
                <th className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {log.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted">{formatDateTime(entry.at)}</td>
                  <td className="px-4 py-2.5">{entry.username || "—"}</td>
                  <td className={cn("px-4 py-2.5", tone(entry.action))}>
                    <span className="font-mono text-xs">{entry.action}</span>
                    {entry.target && <span className="ml-2">{entry.target}</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{entry.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
