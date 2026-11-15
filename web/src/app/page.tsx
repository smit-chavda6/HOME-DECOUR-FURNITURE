import { AboutValues } from "@/components/home/about-values";
import { ArFeature } from "@/components/home/ar-feature";
import { CategoryGrid } from "@/components/home/category-grid";
import { ClosingCta } from "@/components/home/closing-cta";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/home/marquee";
import { NewArrivals } from "@/components/home/new-arrivals";
import { ScrollStory } from "@/components/home/scroll-story";
import { getHomeContent } from "@/lib/data/content";
import {
  getCategoryCounts,
  getFeaturedProducts,
  getNewArrivals,
  getStoreStats,
  type ProductSummary,
} from "@/lib/data/products";

/**
 * Load the catalogue data the home page needs. If the database cannot be
 * reached the page still renders; the product sections are left out.
 */
async function loadHomeData() {
  try {
    const [featured, arrivals, counts, stats] = await Promise.all([
      getFeaturedProducts(6),
      getNewArrivals(10),
      getCategoryCounts(),
      getStoreStats(),
    ]);
    return { featured, arrivals, counts, stats };
  } catch (error) {
    console.error("Home page: could not load products from MongoDB.", error);
    return {
      featured: [] as ProductSummary[],
      arrivals: [] as ProductSummary[],
      counts: {},
      stats: { pieces: 0, models: 0, reviews: 0, rating: 0 },
    };
  }
}

export default async function HomePage() {
  const [{ featured, arrivals, counts, stats }, content] = await Promise.all([loadHomeData(), getHomeContent()]);

  return (
    <>
      <Hero stats={stats} content={content} />
      <Marquee />
      <div id="collections" className="scroll-mt-20">
        <CategoryGrid counts={counts} />
      </div>
      <ScrollStory />
      <FeaturedProducts products={featured} />
      <ArFeature />
      <NewArrivals products={arrivals} />
      <AboutValues />
      <ClosingCta />
    </>
  );
}
