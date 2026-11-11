import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth";
import { isRazorpayEnabled } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

async function CheckoutContent() {
  const user = await requireUser("/checkout");
  return <CheckoutForm user={user} onlinePayment={isRazorpayEnabled()} />;
}

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        title={
          <>
            Almost <em className="text-gradient">yours</em>.
          </>
        }
        description="Three quick steps. Prices are confirmed on our side before anything is charged."
        crumbs={[{ label: "Checkout" }]}
      />
      <div className="container-page">
        <Suspense fallback={<div className="h-[32rem] animate-pulse rounded-panel bg-surface" />}>
          <CheckoutContent />
        </Suspense>
      </div>
    </>
  );
}
