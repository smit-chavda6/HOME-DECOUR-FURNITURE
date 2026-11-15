import type { HomeContent } from "@/lib/data/content";
import { categories } from "@/lib/site";
import { HeroContent } from "./hero-content";

type HeroProps = {
  stats: { pieces: number; models: number; reviews: number; rating: number };
  content: HomeContent;
};

/**
 * Opening section. Always dark (in both themes) so the sunlit picture glows:
 * warm black, a soft copper light from the lower left, and faint vertical
 * hairlines like architectural drawing paper.
 */
export function Hero({ stats, content }: HeroProps) {
  return (
    <section className="relative isolate -mt-[4.25rem] overflow-hidden bg-[#0c0a09]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_10%_95%,rgb(227_165_111/0.16),transparent_70%),radial-gradient(50rem_30rem_at_85%_0%,rgb(243_207_158/0.07),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.035)_0_1px,transparent_1px_7rem)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <HeroContent stats={stats} categoryCount={categories.length} content={content} />
    </section>
  );
}
