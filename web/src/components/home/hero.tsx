import Link from "next/link";
import { ArrowDown, ArrowRight, ScanLine, Star } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { assetUrl } from "@/lib/utils";
import { HeroBackdrop } from "./hero-backdrop";
import { HeroReveal } from "./hero-reveal";

type HeroProps = {
  stats: { pieces: number; models: number; reviews: number; rating: number };
};

const HERO_IMAGE = assetUrl("image/product/Royal Crest Chesterfield Sofa (Leather Sofa).jpg")!;

/** Full-screen cinematic opening over a dark interior photograph. */
export function Hero({ stats }: HeroProps) {
  return (
    <section className="relative isolate -mt-[4.25rem] flex min-h-svh flex-col overflow-hidden pt-[4.25rem]">
      <HeroBackdrop
        src={HERO_IMAGE}
        alt="A tufted leather Chesterfield sofa under a brass floor lamp in a dark panelled room"
      />

      <div className="container-page flex flex-1 flex-col justify-end pt-16 pb-10 sm:pb-14">
        <HeroReveal>
          <p className="eyebrow text-[#f3cf9e]">Home Decor Furniture · Since 2014</p>
          <h1 className="mt-6 max-w-5xl text-[clamp(3.2rem,8.6vw,8.5rem)] leading-[0.86] font-semibold text-white">
            Furniture for the room <em className="text-gradient">you live in</em>.
          </h1>
          <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="max-w-md text-lg leading-relaxed text-white/75">
                Considered pieces in honest materials. Place any of them in your own room with your
                phone, and buy only when it fits.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop" className={buttonStyles({ size: "lg" })}>
                  Explore the collection
                  <ArrowRight aria-hidden />
                </Link>
                <Link
                  href="/ar/live"
                  className={buttonStyles({
                    variant: "outline",
                    size: "lg",
                    className: "border-white/20 bg-white/10 text-white hover:bg-white/20",
                  })}
                >
                  <ScanLine aria-hidden />
                  Try it in your room
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 text-white lg:w-[26rem]">
              {[
                { label: "Pieces", value: stats.pieces },
                { label: "In 3D & AR", value: stats.models },
                {
                  label: `${stats.reviews} reviews`,
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      {stats.rating.toFixed(1)}
                      <Star className="size-4 fill-[#e3a56f] text-[#e3a56f]" aria-hidden />
                    </span>
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="bg-black/45 px-4 py-4 backdrop-blur-md">
                  <dd className="text-2xl font-semibold tabular-nums">{item.value}</dd>
                  <dt className="mt-1 text-xs text-white/60">{item.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </HeroReveal>

        <a
          href="#collections"
          className="mt-12 hidden items-center gap-3 self-start text-xs tracking-[0.25em] text-white/60 uppercase transition-colors hover:text-white sm:flex"
        >
          <span className="grid size-9 place-items-center rounded-full border border-white/25">
            <ArrowDown className="size-4 animate-bounce" aria-hidden />
          </span>
          Scroll to explore
        </a>
      </div>
    </section>
  );
}
