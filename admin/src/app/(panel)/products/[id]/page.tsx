import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/panel/page-title";
import { ProductForm } from "@/components/panel/product-form";
import { requireAdmin } from "@/lib/auth";
import { getProductForEdit } from "@/lib/data/shop";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProductForEdit(id);
  if (!product) notFound();

  return (
    <div className="max-w-4xl">
      <PageTitle title={product.name} description="Edit product" />
      <ProductForm product={product} />
    </div>
  );
}
