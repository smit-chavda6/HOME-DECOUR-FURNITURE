import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatus } from "@/components/panel/order-status";
import { PageTitle } from "@/components/panel/page-title";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats, getOrders } from "@/lib/data/shop";
import { orderStatusLabel } from "@/lib/order-status";
import { formatDate, formatPrice, orderNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [stats, recent] = await Promise.all([getDashboardStats(), getOrders({ limit: 6 })]);

  const tiles = [
    { label: "Revenue, last 30 days", value: formatPrice(stats.revenue30d), note: `${stats.orders30d} orders`, href: "/orders" },
    { label: "Revenue, all time", value: formatPrice(stats.revenue), note: `${stats.orders} orders`, href: "/orders" },
    { label: "Products", value: stats.products, note: `${stats.lowStock} with 3 or fewer left`, href: "/products" },
    { label: "Customers", value: stats.users, note: `${stats.messages} messages`, href: "/customers" },
  ];
  const toShip = (stats.byStatus.placed ?? 0) + (stats.byStatus.confirmed ?? 0);

  return (
    <div className="space-y-12">
      <PageTitle
        title={`Hello, ${admin.name.split(" ")[0]}`}
        description={
          toShip > 0 ? (
            <Link href="/orders?status=placed" className="font-medium text-accent underline underline-offset-4">
              {toShip} {toShip === 1 ? "order needs" : "orders need"} shipping
            </Link>
          ) : (
            "Nothing waiting to ship."
          )
        }
      />

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="rounded-card bg-surface p-5 ring-1 ring-line transition hover:ring-accent/50">
            <dt className="text-sm text-muted">{tile.label}</dt>
            <dd className="mt-2 font-display text-3xl font-semibold tabular-nums">{tile.value}</dd>
            <dd className="mt-1 text-sm text-muted">{tile.note}</dd>
          </Link>
        ))}
      </dl>

      <section>
        <h2 className="font-display text-xl font-semibold">Orders by status</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <li key={status}>
              <Link href={`/orders?status=${status}`} className="inline-block rounded-full border border-line px-4 py-1.5 text-sm hover:bg-surface-2">
                {orderStatusLabel[status] ?? status}: <span className="font-semibold tabular-nums">{count}</span>
              </Link>
            </li>
          ))}
          {Object.keys(stats.byStatus).length === 0 && <li className="text-sm text-muted">No orders yet.</li>}
        </ul>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold">Latest orders</h2>
          <Link href="/orders" className="text-sm underline underline-offset-4 hover:text-accent">
            All orders
          </Link>
        </div>
        <div className="mt-4 relative overflow-x-auto rounded-card ring-1 ring-line">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-surface-2 text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {recent.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium tabular-nums">{orderNumber(order.id)}</td>
                  <td className="px-4 py-3">{order.fullName}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <OrderStatus status={order.status} />
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No orders yet.
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
