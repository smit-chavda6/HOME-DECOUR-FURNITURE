import { Suspense } from "react";
import type { Metadata } from "next";
import { toArProduct } from "@/components/ar/ar-types";
import { LiveRoom } from "@/components/ar/live-room";
import { PageHeader } from "@/components/layout/page-header";
import { get3dProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Live AR room",
  description:
    "Place several pieces of furniture in your own room using your camera or a photo, arrange them, and share a picture before you buy.",
};

export default async function LiveRoomPage() {
  const products = (await get3dProducts().catch(() => [])).map(toArProduct);

  return (
    <>
      <PageHeader
        eyebrow="Live AR room"
        title={
          <>
            Style your room <em className="text-gradient">before</em> you buy.
          </>
        }
        description="Place several pieces at once, drag them where you want, turn them to fit, then save a picture to share."
        crumbs={[{ label: "AR Studio", href: "/ar" }, { label: "Live AR room" }]}
      />
      <div className="container-page">
        {/* Reads ?product= to start with a chosen piece. */}
        <Suspense fallback={<div className="h-72 animate-pulse rounded-panel bg-surface" />}>
          <LiveRoom products={products} />
        </Suspense>
      </div>
    </>
  );
}
