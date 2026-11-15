import type { HomeContent } from "@/lib/data/content";
import type { ProductSummary } from "@/lib/data/products";
import { categories } from "@/lib/site";
import { HeroContent } from "./hero-content";

type HeroProps = {
  stats: { pieces: number; models: number; reviews: number; rating: number };
  content: HomeContent;
  featured: ProductSummary[];
};

/**
 * Opening section on warm sand: espresso headline with the copper accent and
 * one simple sofa illustration. Rounded at the bottom where it meets the
 * dark sections below. Its colours are fixed, the same in both site themes.
 */
export function Hero({ stats, content, featured }: HeroProps) {
  const pick = featured.find((p) => p.category === "sofa") ?? featured[0];
  const spotlight = pick ? { name: pick.name, price: pick.price, slug: pick.slug } : null;

  return (
    <section className="relative isolate -mt-[4.25rem] overflow-hidden rounded-b-[2.5rem] bg-[linear-gradient(160deg,#f3ebdf_0%,#efe6d8_45%,#e6d8c3_100%)] sm:rounded-b-[3.5rem]">
      {/* a soft copper glow behind the sofa and a faint paper grain */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_30rem_at_75%_50%,rgb(184_112_63/0.14),transparent_70%)]" />
      <HeroContent stats={stats} categoryCount={categories.length} content={content} spotlight={spotlight} />
    </section>
  );
}
