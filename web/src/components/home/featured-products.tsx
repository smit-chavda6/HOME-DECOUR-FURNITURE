import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product/product-card";
import type { ProductSummary } from "@/lib/data/products";

export function FeaturedProducts({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;

  return (
    <section className="container-page mt-28 lg:mt-36">
      <SectionHeading
        eyebrow="Most loved"
        title={
          <>
            Pieces people <em className="text-gradient">keep</em> coming back to.
          </>
        }
        action={{ label: "Shop all", href: "/shop" }}
      />

      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {products.map((product, index) => (
          <Reveal key={product.id} delay={(index % 3) * 0.08}>
            <ProductCard product={product} sizes="(min-width: 1024px) 30vw, 46vw" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
