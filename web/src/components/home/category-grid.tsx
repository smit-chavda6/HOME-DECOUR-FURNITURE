import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { categories } from "@/lib/site";
import { assetUrl, cn } from "@/lib/utils";

/** Bento layout: the first category is the large tile, the rest fill a 2x2 grid. */
const tileLayout = [
  "col-span-2 aspect-[16/11] lg:col-span-6 lg:row-span-2 lg:aspect-auto",
  "aspect-[4/5] lg:col-span-3 lg:aspect-auto",
  "aspect-[4/5] lg:col-span-3 lg:aspect-auto",
  "aspect-[4/5] lg:col-span-3 lg:aspect-auto",
  "aspect-[4/5] lg:col-span-3 lg:aspect-auto",
];

const tileSizes = [
  "(min-width: 1024px) 50vw, 100vw",
  "(min-width: 1024px) 25vw, 50vw",
  "(min-width: 1024px) 25vw, 50vw",
  "(min-width: 1024px) 25vw, 50vw",
  "(min-width: 1024px) 25vw, 50vw",
];

export function CategoryGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <section className="container-page mt-28 lg:mt-36">
      <SectionHeading
        eyebrow="Shop by room"
        title={
          <>
            Find the piece <em className="text-gradient">every room</em> is missing.
          </>
        }
        action={{ label: "All furniture", href: "/shop" }}
      />

      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:h-[42rem] lg:grid-cols-12 lg:grid-rows-2">
        {categories.map((category, index) => {
          const count = counts[category.slug];
          return (
            <Reveal key={category.slug} delay={index * 0.06} className={cn(tileLayout[index])}>
              <Link
                href={`/shop?category=${category.slug}`}
                className="group ring-glow relative block h-full overflow-hidden rounded-card bg-surface-2"
              >
                <Image
                  src={assetUrl(category.image)!}
                  alt=""
                  fill
                  sizes={tileSizes[index]}
                  className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white sm:p-6">
                  <div>
                    <p className={cn("text-[0.7rem] font-medium tracking-[0.2em] text-white/70 uppercase", index > 0 && "hidden sm:block")}>
                      {category.blurb}
                    </p>
                    <h3 className={cn("mt-1 font-semibold tracking-tight", index === 0 ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl")}>
                      {category.label}
                    </h3>
                    {count ? (
                      <p className="mt-1 text-sm text-white/70">
                        {count} {count === 1 ? "piece" : "pieces"}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "size-11 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition-all duration-500 group-hover:rotate-45 group-hover:border-transparent group-hover:bg-white group-hover:text-black",
                      index > 0 ? "hidden sm:grid" : "grid",
                    )}
                  >
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
