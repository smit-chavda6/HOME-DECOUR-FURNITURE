import type { Metadata } from "next";
import { CalendarDays, Mail, Phone, ShoppingBag, Users } from "lucide-react";
import { DeleteCustomerButton } from "@/components/panel/row-actions";
import { Avatar, EmptyState, PageHero, StatStrip } from "@/components/panel/ui";
import { requireAdmin } from "@/lib/auth";
import { getAdminUsers } from "@/lib/data/shop";
import { daysAgo, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  await requireAdmin();
  const users = await getAdminUsers();
  const buyers = users.filter((u) => u.orders > 0).length;
  const monthAgo = daysAgo(30);
  const recent = users.filter((u) => new Date(u.joined).getTime() >= monthAgo).length;

  return (
    <div className="rise">
      <PageHero
        icon={Users}
        eyebrow="People"
        title="Your"
        accent="customers"
        description="Everyone with a shop account. Customer accounts can never sign in here; admins are managed under Admins & log."
      />

      <StatStrip
        items={[
          { label: "Accounts", value: users.length, tone: "accent" },
          { label: "Have ordered", value: buyers, tone: "good" },
          { label: "Joined, last 30 days", value: recent },
          { label: "Not ordered yet", value: users.length - buyers },
        ]}
      />

      {users.length === 0 ? (
        <EmptyState title="No customers yet" text="People who register on the shop will appear here." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {users.map((u) => (
            <li key={u.id} className="sheen group rounded-card bg-surface p-5 ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-accent/35">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={u.fullName || u.username} className="size-12 text-sm" />
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold tracking-tight">{u.fullName}</p>
                    <p className="truncate text-sm text-muted">@{u.username}</p>
                  </div>
                </div>
                <span
                  className={
                    u.orders > 0
                      ? "inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent"
                      : "inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted"
                  }
                >
                  <ShoppingBag className="size-3" aria-hidden />
                  {u.orders} {u.orders === 1 ? "order" : "orders"}
                </span>
              </div>
              <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                <li className="flex items-center gap-2 truncate">
                  <Mail className="size-3.5 shrink-0 text-muted" aria-hidden />
                  <a href={`mailto:${u.email}`} className="truncate hover:text-accent">
                    {u.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-muted" aria-hidden />
                  {u.phone}
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted">
                    <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                    Joined {formatDate(u.joined)}
                  </span>
                  <DeleteCustomerButton id={u.id} />
                </li>
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
