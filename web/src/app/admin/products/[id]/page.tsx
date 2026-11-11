import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";
import { getProductForEdit } from "@/lib/data/admin";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProductForEdit(id);
  if (!product) notFound();

  return (
    <div>
      <p className="eyebrow">Edit product</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{product.name}</h1>
      <div className="mt-10 max-w-4xl">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
