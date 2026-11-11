import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="font-display text-4xl font-medium tracking-tight">New product</h1>
      <div className="mt-10 max-w-4xl">
        <ProductForm />
      </div>
    </div>
  );
}
