import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, PencilLine } from "lucide-react";
import { ProductForm } from "@/components/panel/product-form";
import { PageHero } from "@/components/panel/ui";
import { buttonStyles } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getProductForEdit } from "@/lib/data/shop";
import { shopUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProductForEdit(id);
  if (!product) notFound();

  return (
    <div className="rise">
      <PageHero icon={PencilLine} eyebrow="Catalogue · edit" title={product.name} description="Changes go live in the shop as soon as you save.">
        {product.slug && (
          <a href={shopUrl(`/shop/${product.slug}`)} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: "outline" })}>
            <ExternalLink aria-hidden />
            View in shop
          </a>
        )}
      </PageHero>
      <ProductForm product={product} />
    </div>
  );
}
