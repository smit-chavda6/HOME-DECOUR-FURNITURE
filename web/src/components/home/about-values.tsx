import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Hammer, Leaf, Truck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { buttonStyles } from "@/components/ui/button";
import { assetUrl } from "@/lib/utils";

const values = [
  { icon: Award, title: "Premium quality", text: "Finest materials and careful detailing for lasting beauty." },
  { icon: Hammer, title: "Expert craft", text: "Skilled artisans, built to be beautiful and to be used." },
  { icon: Leaf, title: "Responsible", text: "Sustainably sourced materials and careful manufacturing." },
  { icon: Truck, title: "White-glove delivery", text: "Delivered, assembled and placed where you want it." },
];

/** Bento of brand values around a large lifestyle photo. */
export function AboutValues() {
  return (
    <section className="container-page mt-28 lg:mt-36">
      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal className="relative min-h-[26rem] overflow-hidden rounded-panel lg:col-span-7 lg:row-span-2">
          <Image
            src={assetUrl("image/product/ScandiHome™ 3-Seater Sofa.webp")!}
            alt="A Scandinavian-style three-seater sofa in a bright living room"
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
            <p className="text-xs font-semibold tracking-[0.22em] text-white/70 uppercase">Since 2014</p>
            <h2 className="mt-3 max-w-lg text-4xl leading-[0.95] font-semibold sm:text-5xl">
              Design creates culture. <em className="text-[#f3cf9e]">Culture shapes</em> homes.
            </h2>
            <Link href="/about" className={buttonStyles({ variant: "inverse", className: "mt-7 bg-white text-black hover:bg-white/85" })}>
              Our story
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:row-span-2">
          {values.map(({ icon: Icon, title, text }, index) => (
            <li key={title}>
              <Reveal delay={index * 0.06} className="ring-glow h-full rounded-card border border-line bg-surface p-6">
                <span className="glass grid size-11 place-items-center rounded-2xl text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-8 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
