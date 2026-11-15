import type { Metadata } from "next";
import Link from "next/link";
import { paymentLabel } from "@/components/panel/order-status";
import { PageTitle } from "@/components/panel/page-title";
import { OrderStatusSelect } from "@/components/panel/row-actions";
import { requireAdmin } from "@/lib/auth";
import { getOrders } from "@/lib/data/shop";
import { ORDER_STATUSES, orderStatusLabel, type OrderStatus } from "@/lib/order-status";
import { cn, formatDateTime, formatPrice, orderNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  await requireAdmin();
  const raw = (await searchParams).status;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const status = ORDER_STATUSES.includes(value as OrderStatus) ? value : undefined;
  const orders = await getOrders({ status });

  const filters = [{ value: "", label: "All" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: orderStatusLabel[s] }))];

  return (
    <div>
      <PageTitle
        title="Orders"
        description={`${orders.length} orders. Changing a status saves straight away; cancelling puts the items back in stock.`}
      />

      <nav aria-label="Filter by status" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value || "all"}
              href={f.value ? `/orders?status=${f.value}` : "/orders"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap",
                active ? "border-ink bg-ink text-bg" : "border-line hover:bg-surface-2",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <p className="rounded-card bg-surface-2 px-6 py-16 text-center text-muted">No orders here.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-card bg-surface p-5 ring-1 ring-line">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">
                    {orderNumber(order.id)}
                    <span className="ml-3 font-normal text-muted">{formatDateTime(order.createdAt)}</span>
                  </p>
                  <p className="mt-1 text-sm break-words">
                    {order.fullName} · {order.email} · {order.phone}
                  </p>
                  <p className="mt-1 text-sm text-muted">{order.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-semibold tabular-nums">{formatPrice(order.total)}</p>
                  <p className="text-xs text-muted">
                    {paymentLabel(order.paymentMethod)}
                    {order.paymentStatus === "paid" && " · paid"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
                <ul className="text-sm text-muted">
                  {order.lines.map((line, i) => (
                    <li key={`${line.productId}-${i}`} className="tabular-nums">
                      {line.quantity} × {line.name} ({formatPrice(line.price)})
                    </li>
                  ))}
                </ul>
                <OrderStatusSelect id={order.id} status={order.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
