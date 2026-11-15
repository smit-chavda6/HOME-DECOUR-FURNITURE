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
 * Opening section: headline with the copper accent and
 * one simple sofa illustration. Rounded at the bottom where it meets the
 * dark sections below. Espresso in the dark theme, sand in the light theme (globals.css .hero-theme).
 */
export function Hero({ stats, content, featured }: HeroProps) {
  const pick = featured.find((p) => p.category === "sofa") ?? featured[0];
  const spotlight = pick ? { name: pick.name, price: pick.price, slug: pick.slug } : null;

  return (
    <section className="relative isolate -mt-[4.25rem] hero-theme overflow-hidden rounded-b-[2.5rem] bg-[image:var(--h-bg)] sm:rounded-b-[3.5rem]">
      {/* a soft copper glow behind the sofa and a faint paper grain */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_30rem_at_75%_50%,var(--h-glow),transparent_70%),radial-gradient(50rem_35rem_at_10%_95%,var(--h-glow),transparent_70%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(90deg,var(--h-hairline)_0_1px,transparent_1px_7rem)]" />
      <HeroContent stats={stats} categoryCount={categories.length} content={content} spotlight={spotlight} />
    </section>
  );
}
