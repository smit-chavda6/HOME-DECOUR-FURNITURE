import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, Wallet } from "lucide-react";
import { SuccessCelebration } from "@/components/checkout/success-celebration";
import { orderNumber, paymentLabel } from "@/components/orders/order-status";
import { buttonStyles } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getOrderForUser } from "@/lib/data/orders";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false },
};

async function SuccessContent({ searchParams }: { searchParams: PageProps<"/checkout/success">["searchParams"] }) {
  const user = await requireUser("/account/orders");
  const raw = (await searchParams).order;
  const order = await getOrderForUser(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "", user.id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl text-center">
      <SuccessCelebration />
      <p className="eyebrow mt-8 justify-center">Order {orderNumber(order.id)}</p>
      <h1 className="mt-4 text-5xl leading-[0.95] font-semibold sm:text-6xl">
        Thank you, <em className="text-gradient">{order.fullName.split(" ")[0]}</em>.
      </h1>
      <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted">
        Your order is confirmed. We will keep you posted by email, and you can follow it from your
        account at any time.
      </p>

      <div className="mt-12 overflow-hidden rounded-panel border border-line bg-surface text-left">
        <ul className="divide-y divide-line">
          {order.lines.map((line) => (
            <li key={line.productId} className="flex items-center gap-4 px-6 py-4">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {line.image && <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />}
              </span>
              <span className="flex-1 text-sm">
                <span className="block font-medium">{line.name}</span>
                <span className="text-muted">Qty {line.quantity}</span>
              </span>
              <span className="text-sm tabular-nums">{formatPrice(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-px border-t border-line bg-line sm:grid-cols-3">
          {[
            { icon: MapPin, label: "Delivering to", value: order.address },
            { icon: CalendarClock, label: "Arrives in", value: "7 to 14 business days" },
            { icon: Wallet, label: paymentLabel(order.paymentMethod), value: formatPrice(order.total) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-surface px-6 py-5">
              <dt className="flex items-center gap-2 text-xs text-muted">
                <Icon className="size-3.5 text-accent" aria-hidden />
                {label}
              </dt>
              <dd className="mt-1.5 text-sm font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/account/orders" className={buttonStyles({ size: "lg" })}>
          Track my order
        </Link>
        <Link href="/shop" className={buttonStyles({ variant: "outline", size: "lg" })}>
          Keep shopping
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <div className="relative overflow-hidden">
      <div className="spotlight pointer-events-none absolute inset-0 [--x:50%] [--y:0%]" />
      <div className="relative container-page py-16 lg:py-24">
        <Suspense fallback={<div className="mx-auto h-96 max-w-2xl animate-pulse rounded-panel bg-surface" />}>
          <SuccessContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
