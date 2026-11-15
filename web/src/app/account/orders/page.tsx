import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import {
  OrderStatus,
  formatDate,
  orderNumber,
  paymentLabel,
} from "@/components/orders/order-status";
import { ReviewForm } from "@/components/orders/review-form";
import { buttonStyles } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data/orders";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Your orders" };

async function OrdersContent() {
  const user = await requireUser("/account/orders");
  const orders = await getOrdersForUser(user.id);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-panel bg-surface-2 px-6 py-20 text-center">
        <PackageOpen className="size-10 text-muted" aria-hidden />
        <h2 className="mt-5 font-display text-2xl">No orders yet</h2>
        <p className="mt-2 max-w-sm text-muted">
          When you place an order it will appear here, with its status and a place to review each piece.
        </p>
        <Link href="/shop" className={buttonStyles({ className: "mt-6" })}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-6">
      {orders.map((order) => (
        <li key={order.id} className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-line bg-surface-2/60 px-5 py-4 sm:px-6">
            <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted">Order</dt>
                <dd className="font-medium tabular-nums">{orderNumber(order.id)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Placed</dt>
                <dd>{formatDate(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Total</dt>
                <dd className="font-medium tabular-nums">{formatPrice(order.total)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Payment</dt>
                <dd>{paymentLabel(order.paymentMethod)}</dd>
              </div>
            </dl>
            <OrderStatus status={order.status} />
          </div>

          <ul className="divide-y divide-line px-5 sm:px-6">
            {order.lines.map((line) => (
              <li key={`${order.id}-${line.productId}`} className="flex flex-wrap gap-4 py-5">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {line.image && (
                    <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {line.slug ? (
                    <Link href={`/shop/${line.slug}`} className="font-medium hover:text-accent">
                      {line.name}
                    </Link>
                  ) : (
                    <p className="font-medium">{line.name}</p>
                  )}
                  <p className="mt-1 text-sm text-muted tabular-nums">
                    {line.quantity} × {formatPrice(line.price)}
                  </p>
                </div>
                {/* Reviews open once the order has been delivered. */}
                {order.status === "delivered" && line.slug && (
                  <div className="flex w-full justify-end sm:w-auto sm:max-w-md sm:flex-1">
                    <ReviewForm
                      productId={line.productId}
                      productName={line.name}
                      rating={line.myRating}
                      comment={line.myComment}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>

          <p className="border-t border-line px-5 py-4 text-sm text-muted sm:px-6">
            Deliver to: {order.fullName}, {order.address}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">Orders</h1>
      <div className="mt-10">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-surface-2" />}>
          <OrdersContent />
        </Suspense>
      </div>
    </>
  );
}
