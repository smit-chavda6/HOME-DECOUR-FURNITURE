import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { ArStudio } from "@/components/ar/ar-studio";
import { RoomAdvisor } from "@/components/ar/room-advisor";
import { PageHeader } from "@/components/layout/page-header";
import { get3dProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "AR room planner",
  description:
    "Place furniture in your own room with AR on your phone, or upload a photo of your room and let AI suggest pieces that suit it.",
};

export default async function ArPage() {
  const products = await get3dProducts().catch(() => []);

  return (
    <>
      <PageHeader
        eyebrow="HomeSphere AR"
        title={<>See it in <em className="text-gradient">your room</em> before you buy</>}
        description="Explore pieces in 3D, place them on your floor at real size with your phone, or let our AI suggest furniture from a photo of your room."
        crumbs={[{ label: "AR Studio" }]}
      >
        <Link href="/ar/live" className={buttonStyles({ size: "lg", className: "mt-8" })}>
          <ScanLine aria-hidden />
          Open the live AR room
        </Link>
      </PageHeader>

      <section aria-labelledby="studio" className="container-page">
        <h2 id="studio" className="sr-only">3D and AR viewer</h2>
        {/* The selected product comes from ?product= in the URL. */}
        <Suspense fallback={<div className="aspect-[16/10] animate-pulse rounded-panel bg-surface-2" />}>
          <ArStudio products={products} />
        </Suspense>
      </section>

      <section aria-labelledby="advisor" className="container-page mt-24 border-t border-line pt-16">
        <p className="eyebrow">AI room advisor</p>
        <h2 id="advisor" className="mt-3 max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Not sure what suits your space? Show us.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Upload a photo of your room. We read its style, light and colours, then pick pieces from our
          collection that fit.
        </p>
        <div className="mt-10">
          <RoomAdvisor />
        </div>
      </section>
    </>
  );
}
