import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Award, HeartHandshake, Leaf } from "lucide-react";
import { Journey } from "@/components/about/journey";
import { PageHeader } from "@/components/layout/page-header";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { ScrollWords } from "@/components/motion/scroll-words";
import { buttonStyles } from "@/components/ui/button";
import { delay } from "@/lib/motion";
import { assetUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About us",
  description: "From a small woodworking workshop in 2014 to an online furniture store with AR previews: the story and values behind Home Decor Furniture.",
};

const FOUNDED = 2014;
const years = new Date().getFullYear() - FOUNDED;

const stats = [
  { value: years, suffix: "", label: "Years of craft" },
  { value: 5, suffix: "", label: "Furniture categories" },
  { value: 4, suffix: "", label: "People in the core team" },
  { value: 24, suffix: "h", label: "Typical reply time" },
];

const values = [
  { icon: Award, title: "Uncompromising quality", text: "Superior materials and careful craftsmanship you can feel, built to last for years." },
  { icon: HeartHandshake, title: "Customer dedication", text: "Your satisfaction is our foundation, from the first browse to delivery and beyond." },
  { icon: Leaf, title: "Sustainable innovation", text: "Classic design and modern ideas, with responsible sourcing and eco-friendly practices." },
];

const timeline = [
  { year: "2014", title: "The beginning", text: "A small workshop, fuelled by a love of woodworking and timeless design." },
  { year: "2017", title: "First showroom", text: "We opened our first store, met our community and grew the collection." },
  { year: "2020", title: "Going online", text: "Our online store brought Home Decor Furniture to homes across the country." },
  { year: "2025", title: "HomeSphere AR", text: "Customers can now place furniture in their own rooms before they buy." },
];

const team = [
  { name: "Smit Chavda", role: "Founder & CEO", text: "Leads the company's vision and product curation." },
  { name: "Krish Kuvrani", role: "Creative Director", text: "Shapes our look and discovers new design ideas." },
  { name: "Vairag Shah", role: "Operations Manager", text: "Gets every piece from workshop to home with care." },
  { name: "Kush Ranpura", role: "Web Developer", text: "Builds the digital home for our furniture." },
];

const story =
  "We blend time-tested craftsmanship with modern design to make pieces that last. From a small family workshop to a trusted name, our promise has stayed the same: help you create a home you love, one piece at a time. We source responsibly, build with care and deliver with attention to every detail.";

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow={`Since ${FOUNDED}`}
        title={<>Crafting stories, <em className="text-gradient">building homes</em></>}
        description="Furniture is not just about filling a space. It is about creating a place that feels like you."
        crumbs={[{ label: "About" }]}
      />

      {/* Cinematic image: opens out of a smaller frame, then a caption slides in. */}
      <section className="container-page">
        <div className="relative aspect-[4/3] overflow-hidden rounded-panel bg-surface-2 sm:aspect-[21/9]">
          <div className="enter-reveal absolute inset-0" style={delay(250)}>
            <Image
              src={assetUrl("image/rooms/living.svg")!}
              alt="Illustrated living room with a linen sofa, black marble coffee table and travertine side table"
              fill
              preload
              sizes="100vw"
              className="ken-burns object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="enter-rise absolute bottom-5 left-5 flex flex-wrap gap-2 sm:bottom-8 sm:left-8" style={delay(900)}>
            {["Workshop-built", "Delivered & assembled", "Preview in AR"].map((t) => (
              <span key={t} className="rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers that count up as they appear. */}
      <section className="container-page mt-16">
        <dl className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 0.08}
              className="flex flex-col-reverse border-line px-2 py-8 even:border-l sm:px-6 lg:border-l lg:first:border-l-0"
            >
              {/* dt comes first in the markup; flex-col-reverse shows the number on top. */}
              <dt className="mt-2 text-sm text-muted">{s.label}</dt>
              <dd className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
                <CountUp to={s.value} suffix={s.suffix} />
              </dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* Story: heading stays put while the paragraph lights up word by word. */}
      <section className="container-page mt-24 grid gap-10 lg:mt-32 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <p className="eyebrow">Design with purpose</p>
            <h2 className="mt-4 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Timeless craft, made for <em className="text-gradient">the way you live now</em>.
            </h2>
          </Reveal>
        </div>
        <ScrollWords text={story} className="text-2xl leading-snug font-medium tracking-tight sm:text-3xl lg:text-4xl" />
      </section>

      {/* Values: numbered panels with a hover lift and an accent rule that grows. */}
      <section className="container-page mt-24 lg:mt-32">
        <Reveal>
          <p className="eyebrow">What we stand for</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Three promises</h2>
        </Reveal>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Reveal delay={i * 0.1} className="h-full">
                <div className="group relative flex h-full flex-col overflow-hidden rounded-panel bg-surface p-8 ring-1 ring-line transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow)] hover:ring-accent/40">
                  <div className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-[radial-gradient(circle,var(--glow),transparent_70%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                  <div className="flex items-start justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-accent transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span className="font-mono text-sm text-muted">0{i + 1}</span>
                  </div>
                  <h3 className="mt-10 text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 mb-8 leading-relaxed text-muted">{text}</p>
                  <span aria-hidden className="mt-auto block h-px w-10 bg-accent transition-all duration-700 group-hover:w-full" />
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Journey: a rail that fills as you scroll. */}
      <section className="container-page mt-24 lg:mt-32">
        <Reveal>
          <p className="eyebrow">Our journey</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {years} years in <em className="text-gradient">four steps</em>
          </h2>
        </Reveal>
        <Journey steps={timeline} />
      </section>

      {/* Team. */}
      <section className="container-page mt-24 lg:mt-32">
        <Reveal>
          <p className="eyebrow">The team</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">The people behind the craft</h2>
        </Reveal>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((person, i) => (
            <li key={person.name}>
              <Reveal delay={i * 0.08} className="h-full">
                <div className="group relative h-full overflow-hidden rounded-panel bg-surface-2 p-7 transition-colors duration-500 hover:bg-surface">
                  <span className="relative grid size-16 place-items-center rounded-full font-mono text-lg tracking-wider text-ink">
                    <span className="absolute inset-0 rounded-full border border-line transition-all duration-700 group-hover:scale-110 group-hover:border-accent" />
                    <span className="absolute inset-1.5 rounded-full bg-[conic-gradient(from_180deg,var(--accent),transparent_60%)] opacity-25 transition-transform duration-1000 group-hover:rotate-180" />
                    <span className="relative">{person.name.split(" ").map((p) => p[0]).join("")}</span>
                  </span>
                  <h3 className="mt-8 text-xl font-semibold">{person.name}</h3>
                  <p className="mt-1 text-sm font-medium text-accent">{person.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{person.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing call to action over a room scene. */}
      <section className="container-page mt-24 lg:mt-32">
        <Reveal>
          <div className="group relative isolate overflow-hidden rounded-panel px-8 py-16 sm:px-14 sm:py-20">
            <Image
              src={assetUrl("image/rooms/terracotta.svg")!}
              alt=""
              fill
              sizes="100vw"
              className="-z-10 object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/10" />
            <p className="eyebrow text-white/70">Visit or browse</p>
            <h2 className="mt-4 max-w-xl text-4xl leading-tight font-semibold text-white sm:text-5xl">
              Experience the comfort in person.
            </h2>
            <p className="mt-4 max-w-md text-white/75">Visit our showroom in Ahmedabad, or explore the collection online and preview it in your room.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className={buttonStyles({ variant: "inverse", size: "lg", className: "bg-white text-black hover:bg-white/85" })}>
                Shop the collection
                <ArrowRight aria-hidden />
              </Link>
              <Link href="/contact" className={buttonStyles({ variant: "outline", size: "lg", className: "border-white/30 text-white hover:bg-white/10" })}>
                Contact us
                <ArrowUpRight aria-hidden />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
