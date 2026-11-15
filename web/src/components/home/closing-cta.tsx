import Link from "next/link";
import { ArrowRight, ScanLine } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { buttonStyles } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="container-page mt-28 lg:mt-36">
      <Reveal className="relative overflow-hidden rounded-panel border border-line px-6 py-20 text-center sm:px-10 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_22rem_at_50%_120%,var(--glow),transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[30rem] -translate-x-1/2 rounded-full border border-line" />
        <div className="pointer-events-none absolute -top-60 left-1/2 size-[44rem] -translate-x-1/2 rounded-full border border-line/60" />
        <h2 className="relative mx-auto max-w-4xl text-5xl leading-[0.92] font-semibold sm:text-6xl lg:text-8xl">
          Ready to <em className="text-gradient">transform</em> your space?
        </h2>
        <p className="relative mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Browse the collection, place your favourites in your room, and order with confidence.
        </p>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className={buttonStyles({ size: "lg" })}>
            Shop the collection
            <ArrowRight aria-hidden />
          </Link>
          <Link href="/ar/live" className={buttonStyles({ variant: "outline", size: "lg" })}>
            <ScanLine aria-hidden />
            Open the AR room
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
