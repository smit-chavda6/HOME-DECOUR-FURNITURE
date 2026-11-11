import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { WishlistGrid } from "@/components/product/wishlist-grid";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Saved for later"
        title={<>Your <em className="text-gradient">wishlist</em></>}
        description="Pieces you have saved on this device. Tap the heart on any product to add it."
        crumbs={[{ label: "Wishlist" }]}
      />
      <div className="container-page">
        <WishlistGrid />
      </div>
    </>
  );
}
