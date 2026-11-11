import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, HeartHandshake, Leaf } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { buttonStyles } from "@/components/ui/button";
import { assetUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About us",
  description: "From a small woodworking workshop in 2014 to an online furniture store with AR previews: the story and values behind Home Decor Furniture.",
};

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

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Since 2014"
        title={<>Crafting stories, <em className="text-gradient">building homes</em></>}
        description="Furniture is not just about filling a space. It is about creating a place that feels like you."
        crumbs={[{ label: "About" }]}
      />

      <section className="container-page">
        <div className="relative aspect-[16/9] overflow-hidden rounded-panel bg-surface-2 sm:aspect-[21/9]">
          <Image
            src={assetUrl("image/product/Azure Luxe™ Velvet 3-Seater Sofa.webp")!}
            alt="A blue velvet three-seater sofa in a styled living room"
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="container-page mt-24 grid gap-10 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="eyebrow">Design with purpose</p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-medium tracking-tight sm:text-4xl">
            Timeless craft, made for the way you live now.
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="space-y-5 text-lg leading-relaxed text-muted">
          <p>
            We blend time-tested craftsmanship with modern design to make pieces that last. From a small
            family workshop to a trusted name, our promise has stayed the same: help you create a home
            you love, one piece at a time.
          </p>
          <p>We source responsibly, build with care and deliver with attention to every detail.</p>
        </Reveal>
      </section>

      <section className="container-page mt-24">
        <ul className="grid gap-6 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Reveal delay={i * 0.06} className="h-full rounded-panel bg-surface p-8 ring-1 ring-line">
                <Icon className="size-7 text-accent" aria-hidden />
                <h3 className="mt-6 font-display text-2xl font-medium">{title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page mt-24 lg:mt-32">
        <p className="eyebrow">Our journey</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">Twelve years in four steps</h2>
        <ol className="mt-12 grid gap-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {timeline.map((step, i) => (
            <li key={step.year}>
              <Reveal delay={i * 0.06}>
                <p className="font-display text-5xl font-medium text-accent">{step.year}</p>
                <h3 className="mt-4 font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page mt-24 lg:mt-32">
        <p className="eyebrow">The team</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">The people behind the craft</h2>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((person) => (
            <li key={person.name} className="rounded-panel bg-surface-2 p-7">
              <span className="grid size-14 place-items-center rounded-full bg-accent font-display text-xl text-accent-ink">
                {person.name.split(" ").map((p) => p[0]).join("")}
              </span>
              <h3 className="mt-6 font-display text-xl font-medium">{person.name}</h3>
              <p className="text-sm font-medium text-accent">{person.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{person.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page mt-24 lg:mt-32">
        <div className="flex flex-col items-start justify-between gap-6 rounded-panel bg-inverse px-8 py-12 text-inverse-ink sm:flex-row sm:items-center lg:px-14">
          <div>
            <h2 className="font-display text-3xl font-medium">Experience the comfort</h2>
            <p className="mt-2 text-inverse-muted">Visit our showroom in Ahmedabad, or explore the collection online.</p>
          </div>
          <Link href="/shop" className={buttonStyles({ variant: "inverse", size: "lg" })}>
            Shop the collection
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
