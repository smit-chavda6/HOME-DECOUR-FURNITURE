import { formatDate, orderNumber, paymentLabel } from "@/components/orders/order-status";
import { OrderStatusSelect } from "@/components/admin/row-actions";
import { requireAdmin } from "@/lib/auth";
import { getAllOrders } from "@/lib/data/orders";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getAllOrders();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted">
          {orders.length} orders. Changing a status saves straight away; cancelling puts the items back in stock.
        </p>
      </div>

      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-card bg-surface p-5 ring-1 ring-line">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium tabular-nums">
                  {orderNumber(order.id)}
                  <span className="ml-3 font-normal text-muted">{formatDate(order.createdAt)}</span>
                </p>
                <p className="mt-1 text-sm">
                  {order.fullName} · {order.email} · {order.phone}
                </p>
                <p className="mt-1 text-sm text-muted">{order.address}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-medium tabular-nums">{formatPrice(order.total)}</p>
                <p className="text-xs text-muted">
                  {paymentLabel(order.paymentMethod)}
                  {order.paymentStatus === "paid" && " · paid"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
              <ul className="text-sm text-muted">
                {order.lines.map((line) => (
                  <li key={line.productId} className="tabular-nums">
                    {line.quantity} × {line.name} ({formatPrice(line.price)})
                  </li>
                ))}
              </ul>
              <OrderStatusSelect id={order.id} status={order.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
