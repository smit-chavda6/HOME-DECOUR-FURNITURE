import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText, IndianRupee, Megaphone, Package, Plus, ShoppingCart, Users } from "lucide-react";
import { CountUp, RevenueChart, Sparkline, StatusBars, SunArc } from "@/components/panel/charts";
import { OrderStatus } from "@/components/panel/order-status";
import { requireAdmin } from "@/lib/auth";
import { getDailySeries, getDashboardStats, getOrders } from "@/lib/data/shop";
import { ORDER_STATUSES, orderStatusLabel } from "@/lib/order-status";
import { formatDate, formatPrice, orderNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [stats, recent, series] = await Promise.all([getDashboardStats(), getOrders({ limit: 6 }), getDailySeries(30)]);

  const last14 = series.slice(-14);
  const toShip = (stats.byStatus.placed ?? 0) + (stats.byStatus.confirmed ?? 0);

  const tiles = [
    {
      label: "Revenue · 30 days",
      value: stats.revenue30d,
      kind: "inr" as const,
      note: `${stats.orders30d} ${stats.orders30d === 1 ? "order" : "orders"}`,
      href: "/orders",
      icon: IndianRupee,
      spark: last14.map((d) => d.revenue),
    },
    {
      label: "Revenue · all time",
      value: stats.revenue,
      kind: "inr" as const,
      note: `${stats.orders} ${stats.orders === 1 ? "order" : "orders"}`,
      href: "/orders",
      icon: ShoppingCart,
      spark: last14.map((d) => d.orders),
    },
    {
      label: "Products",
      value: stats.products,
      kind: "int" as const,
      note: `${stats.lowStock} with 3 or fewer left`,
      href: "/products",
      icon: Package,
      spark: null,
    },
    {
      label: "Customers",
      value: stats.users,
      kind: "int" as const,
      note: `${stats.messages} messages`,
      href: "/customers",
      icon: Users,
      spark: last14.map((d) => d.customers),
    },
  ];

  const statusRows = ORDER_STATUSES.map((s) => ({
    label: orderStatusLabel[s],
    value: stats.byStatus[s] ?? 0,
    href: `/orders?status=${s}`,
  }));

  const quick = [
    { href: "/products/new", label: "Add a product", icon: Plus },
    { href: "/content/blog/new", label: "Write an article", icon: FileText },
    { href: "/content/banner", label: "Post an announcement", icon: Megaphone },
  ];

  return (
    <div className="rise space-y-6">
      {/* greeting */}
      <section className="sheen relative overflow-hidden rounded-card bg-surface p-6 ring-1 ring-line sm:p-8">
        <div
          aria-hidden
          className="absolute -top-24 -right-16 size-72 rounded-full bg-[radial-gradient(circle,rgb(234_88_12/0.1),transparent_65%)] blur-2xl"
        />
        <div className="relative">
          <SunArc name={admin.name.split(" ")[0]} />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {toShip > 0 ? (
              <Link
                href="/orders?status=placed"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink shadow-[0_8px_30px_-8px_var(--glow)] transition hover:brightness-110"
              >
                {toShip} {toShip === 1 ? "order needs" : "orders need"} shipping
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted">
                <span className="size-1.5 rounded-full bg-sage" aria-hidden />
                Nothing waiting to ship
              </span>
            )}
            {quick.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-sm transition hover:border-accent/50 hover:text-accent"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* key numbers */}
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, kind, note, href, icon: Icon, spark }) => (
          <Link
            key={label}
            href={href}
            className="sheen group relative flex flex-col rounded-card bg-surface p-5 ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:ring-accent/40"
          >
            <div className="flex items-start justify-between">
              <dt className="text-sm text-muted">{label}</dt>
              <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon className="size-4" aria-hidden />
              </span>
            </div>
            <dd className="mt-3 font-display text-3xl font-semibold tracking-tight">
              <CountUp value={value} kind={kind} />
            </dd>
            <dd className="mt-1 text-sm text-muted">{note}</dd>
            {spark && (
              <dd className="mt-4">
                <Sparkline values={spark} />
              </dd>
            )}
          </Link>
        ))}
      </dl>

      {/* charts */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="rounded-card bg-surface p-5 ring-1 ring-line sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">Revenue per day</h2>
            <p className="font-mono text-[0.68rem] tracking-[0.14em] text-muted uppercase">Last 30 days · excl. cancelled</p>
          </div>
          <div className="mt-5">
            <RevenueChart data={series} />
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-muted hover:text-ink">View as table</summary>
            <div className="mt-3 max-h-64 overflow-auto rounded-xl ring-1 ring-line">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface-solid text-xs text-muted uppercase">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Day</th>
                    <th className="px-3 py-2 text-right font-semibold">Orders</th>
                    <th className="px-3 py-2 text-right font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...series].reverse().map((d) => (
                    <tr key={d.date}>
                      <td className="px-3 py-1.5">{formatDate(`${d.date}T00:00:00Z`)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{d.orders}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatPrice(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <section className="rounded-card bg-surface p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-display text-xl font-semibold">Orders by status</h2>
          <p className="mt-1 text-sm text-muted">All time. Select a row to see those orders.</p>
          <div className="mt-6">
            <StatusBars rows={statusRows} />
          </div>
        </section>
      </div>

      {/* latest orders */}
      <section className="rounded-card bg-surface p-5 ring-1 ring-line sm:p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">Latest orders</h2>
          <Link href="/orders" className="text-sm text-muted underline-offset-4 hover:text-accent hover:underline">
            All orders
          </Link>
        </div>
        <div className="relative mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs text-muted uppercase">
              <tr className="border-b border-line">
                <th className="py-3 pr-4 font-semibold">Order</th>
                <th className="py-3 pr-4 font-semibold">Customer</th>
                <th className="py-3 pr-4 font-semibold">Date</th>
                <th className="py-3 pr-4 font-semibold">Total</th>
                <th className="py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-surface-2">
                  <td className="py-3 pr-4 font-mono text-xs font-medium">{orderNumber(order.id)}</td>
                  <td className="py-3 pr-4">{order.fullName}</td>
                  <td className="py-3 pr-4 text-muted">{formatDate(order.createdAt)}</td>
                  <td className="py-3 pr-4 tabular-nums">{formatPrice(order.total)}</td>
                  <td className="py-3">
                    <OrderStatus status={order.status} />
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted">
                    No orders yet. They will appear here as soon as someone buys.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
