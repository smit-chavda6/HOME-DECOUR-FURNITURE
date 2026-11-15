import type { Metadata } from "next";
import { PageTitle } from "@/components/panel/page-title";
import { ProductForm } from "@/components/panel/product-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <PageTitle title="New product" />
      <ProductForm />
    </div>
  );
}
