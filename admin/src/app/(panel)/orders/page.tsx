import type { Metadata } from "next";
import Link from "next/link";
import { Check, CreditCard, MapPin, PackageCheck, ShoppingCart, Truck, X } from "lucide-react";
import { paymentLabel } from "@/components/panel/order-status";
import { OrderStatusSelect } from "@/components/panel/row-actions";
import { Avatar, EmptyState, PageHero, StatStrip } from "@/components/panel/ui";
import { requireAdmin } from "@/lib/auth";
import { getOrders } from "@/lib/data/shop";
import { ORDER_STATUSES, orderStatusLabel, type OrderStatus } from "@/lib/order-status";
import { cn, formatDateTime, formatPrice, orderNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

const STEPS = [
  { key: "placed", label: "Placed", icon: ShoppingCart },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
] as const;

/** Where an order is on its journey, as four connected steps. */
function Progress({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-red-600/12 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300">
        <X className="size-3.5" aria-hidden />
        Cancelled · items returned to stock
      </p>
    );
  }
  if (status === "pending_payment") {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
        <CreditCard className="size-3.5" aria-hidden />
        Waiting for online payment
      </p>
    );
  }
  const at = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="flex w-full max-w-md items-center" aria-label={`Order status: ${orderStatusLabel[status] ?? status}`}>
      {STEPS.map((s, i) => {
        const done = i <= at;
        const Icon = s.icon;
        return (
          <li key={s.key} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
            <span className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full transition",
                  done
                    ? "bg-accent text-accent-ink shadow-[0_6px_18px_-6px_var(--glow)]"
                    : "bg-surface-2 text-muted ring-1 ring-line",
                  i === at && "ring-4 ring-accent/20",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className={cn("text-[0.68rem]", done ? "font-medium text-ink" : "text-muted")}>{s.label}</span>
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-line">
                <span className={cn("block h-full bg-accent transition-all", i < at ? "w-full" : "w-0")} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  await requireAdmin();
  const raw = (await searchParams).status;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const status = ORDER_STATUSES.includes(value as OrderStatus) ? value : undefined;
  const [orders, all] = await Promise.all([getOrders({ status }), status ? getOrders() : null]);
  const every = all ?? orders;

  const count = (s: string) => every.filter((o) => o.status === s).length;
  const toShip = count("placed") + count("confirmed");
  const revenue = every.filter((o) => !["cancelled", "pending_payment"].includes(o.status)).reduce((s, o) => s + o.total, 0);
  const filters = [{ value: "", label: "All", n: every.length }, ...ORDER_STATUSES.map((s) => ({ value: s, label: orderStatusLabel[s], n: count(s) }))];

  return (
    <div className="rise">
      <PageHero
        icon={ShoppingCart}
        eyebrow="Sales"
        title="Orders,"
        accent="start to doorstep"
        description="Move an order along as it ships. Changing the status saves straight away; cancelling puts the items back in stock."
      />

      <StatStrip
        items={[
          { label: "Orders", value: every.length, tone: "accent" },
          { label: "To ship", value: toShip, tone: toShip ? "warn" : "default" },
          { label: "Delivered", value: count("delivered"), tone: "good" },
          { label: "Revenue", value: formatPrice(revenue) },
        ]}
      />

      <nav aria-label="Filter by status" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value || "all"}
              href={f.value ? `/orders?status=${f.value}` : "/orders"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition",
                active
                  ? "border-transparent bg-accent font-medium text-accent-ink shadow-[0_8px_24px_-10px_var(--glow)]"
                  : "border-line bg-surface hover:border-accent/40 hover:text-accent",
              )}
            >
              {f.label}
              <span className={cn("rounded-full px-1.5 font-mono text-[0.65rem]", active ? "bg-black/15" : "bg-surface-2 text-muted")}>{f.n}</span>
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <EmptyState title="No orders here" text="When someone buys, their order appears here with everything you need to ship it." />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="sheen rounded-card bg-surface p-5 ring-1 ring-line transition hover:ring-accent/30 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={order.fullName || order.email} />
                  <div className="min-w-0">
                    <p className="font-medium">{order.fullName}</p>
                    <p className="mt-0.5 text-sm break-words text-muted">
                      {order.email} · {order.phone}
                    </p>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {order.address}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs tracking-wider text-muted">{orderNumber(order.id)}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{formatPrice(order.total)}</p>
                  <p className="text-xs text-muted">
                    {paymentLabel(order.paymentMethod)}
                    {order.paymentStatus === "paid" && <span className="ml-1 rounded-full bg-sage/15 px-1.5 text-sage">paid</span>}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 border-t border-line pt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="space-y-4">
                  <Progress status={order.status} />
                  <ul className="flex flex-wrap gap-2 text-sm">
                    {order.lines.map((line, i) => (
                      <li key={`${line.productId}-${i}`} className="rounded-full bg-surface-2 px-3 py-1 tabular-nums">
                        <span className="text-muted">{line.quantity} ×</span> {line.name}{" "}
                        <span className="text-muted">· {formatPrice(line.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-1.5 lg:items-end">
                  <span className="text-xs text-muted">{formatDateTime(order.createdAt)}</span>
                  <OrderStatusSelect id={order.id} status={order.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
