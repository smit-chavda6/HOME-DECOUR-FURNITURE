import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product/product-card";
import type { ProductSummary } from "@/lib/data/products";

/** Sideways-scrolling row of the newest pieces. */
export function NewArrivals({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-28 lg:mt-36">
      <div className="container-page">
        <SectionHeading
          eyebrow="Just in"
          title={
            <>
              New <em className="text-gradient">arrivals</em>.
            </>
          }
          action={{ label: "Shop newest", href: "/shop?sort=newest" }}
        />
      </div>
      <ul
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[max(1rem,calc((100vw-84rem)/2+2.5rem))] pb-6"
        aria-label="New arrivals"
      >
        {products.map((product) => (
          <li key={product.id} className="w-[72vw] shrink-0 snap-start sm:w-80">
            <ProductCard product={product} sizes="(min-width: 640px) 20rem, 72vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
