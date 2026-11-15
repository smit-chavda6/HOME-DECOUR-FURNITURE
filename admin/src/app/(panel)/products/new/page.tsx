import type { Metadata } from "next";
import { PackagePlus } from "lucide-react";
import { ProductForm } from "@/components/panel/product-form";
import { PageHero } from "@/components/panel/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="rise">
      <PageHero
        icon={PackagePlus}
        eyebrow="Catalogue · new"
        title="Add a"
        accent="new piece"
        description="Fill in the details; the preview on the right shows how it will look in the shop."
      />
      <ProductForm />
    </div>
  );
}
