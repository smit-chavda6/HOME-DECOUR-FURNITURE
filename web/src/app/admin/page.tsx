import Link from "next/link";
import { OrderStatus, formatDate, orderNumber } from "@/components/orders/order-status";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/admin";
import { getAllOrders } from "@/lib/data/orders";
import { orderStatusLabel } from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [stats, recent] = await Promise.all([getDashboardStats(), getAllOrders(6)]);

  const tiles = [
    { label: "Revenue, last 30 days", value: formatPrice(stats.revenue30d), note: `${stats.orders30d} orders` },
    { label: "Revenue, all time", value: formatPrice(stats.revenue), note: `${stats.orders} orders` },
    { label: "Products", value: stats.products, note: `${stats.lowStock} with 3 or fewer left`, href: "/admin/products" },
    { label: "Customers", value: stats.users, note: `${stats.reviews} reviews`, href: "/admin/users" },
  ];

  const toAction = (stats.byStatus.placed ?? 0) + (stats.byStatus.confirmed ?? 0);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Overview</h1>
        {toAction > 0 && (
          <p className="mt-2 text-muted">
            <Link href="/admin/orders" className="font-medium text-accent underline underline-offset-4">
              {toAction} {toAction === 1 ? "order needs" : "orders need"} shipping
            </Link>
          </p>
        )}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-card bg-surface p-5 ring-1 ring-line">
            <dt className="text-sm text-muted">{tile.label}</dt>
            <dd className="mt-2 font-display text-3xl font-medium tabular-nums">{tile.value}</dd>
            <dd className="mt-1 text-sm text-muted">
              {tile.href ? <Link href={tile.href} className="hover:text-accent">{tile.note}</Link> : tile.note}
            </dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="font-display text-2xl font-medium">Orders by status</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <li key={status} className="rounded-full border border-line px-4 py-1.5 text-sm">
              {orderStatusLabel[status] ?? status}: <span className="font-semibold tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-medium">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm underline underline-offset-4 hover:text-accent">
            All orders
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-card ring-1 ring-line">
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
                  <td className="px-4 py-3"><OrderStatus status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
