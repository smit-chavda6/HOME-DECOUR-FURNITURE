import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, HelpCircle, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { OpeningHours } from "@/components/contact/opening-hours";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { delay } from "@/lib/motion";
import { getSettings } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about an order, custom furniture or choosing the right piece? Send us a message or call our team in Ahmedabad.",
};

/** A quiet architectural street plan with a pulsing pin, drawn in SVG. */
function StreetPlan() {
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <rect width="400" height="220" fill="var(--surface-2)" />
      <g stroke="var(--line)" strokeWidth="10" fill="none" strokeLinecap="square">
        <path d="M-10 70H410M-10 160H410M90 -10V230M250 -10V230M330 -10L180 230" />
      </g>
      <g stroke="var(--line)" strokeWidth="3" fill="none" opacity="0.7">
        <path d="M-10 115H410M170 -10V230M40 -10V230" />
      </g>
      <g fill="var(--surface)">
        <rect x="104" y="84" width="54" height="62" rx="4" />
        <rect x="186" y="84" width="54" height="24" rx="4" />
        <rect x="264" y="174" width="70" height="40" rx="4" />
        <rect x="8" y="8" width="72" height="52" rx="4" />
      </g>
      <g transform="translate(213 128)">
        <circle r="22" fill="var(--accent)" opacity="0.18" className="ping-soft" style={{ transformOrigin: "0 0", transformBox: "fill-box" }} />
        <path d="M0 0c-9-12-13-19-13-25a13 13 0 1 1 26 0c0 6-4 13-13 25z" fill="var(--accent)" />
        <circle cy="-25" r="4.5" fill="var(--bg)" />
      </g>
    </svg>
  );
}

export default async function ContactPage() {
  const settings = await getSettings();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;
  const channels = [
    { icon: Phone, label: "Call us", value: settings.phone, note: "Mon–Sat, during opening hours", href: `tel:${settings.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: settings.email, note: "Replies within one working day", href: `mailto:${settings.email}` },
    { icon: MapPin, label: "Visit the showroom", value: settings.address, note: "Open in Google Maps", href: mapsUrl, external: true },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title={<>Let&apos;s talk about <em className="text-gradient">your home</em></>}
        description="Questions about an order, a custom piece or what will suit your room. We usually reply within one working day."
        crumbs={[{ label: "Contact" }]}
      />

      {/* Three ways to reach us: cards fill with colour from below on hover. */}
      <section className="container-page" aria-label="Ways to reach us">
        <ul className="grid gap-4 md:grid-cols-3">
          {channels.map(({ icon: Icon, label, value, note, href, external }, i) => (
            <li key={label} className="enter-rise" style={delay(450 + i * 110)}>
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="group relative flex h-full flex-col overflow-hidden rounded-panel bg-surface p-7 ring-1 ring-line transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow)]"
              >
                <span aria-hidden className="absolute inset-0 origin-bottom scale-y-0 bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                <span className="relative flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-accent transition-colors duration-500 group-hover:bg-bg/10">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-5 text-muted transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-bg"
                  />
                </span>
                <span className="relative mt-10 text-sm text-muted transition-colors duration-500 group-hover:text-bg/60">{label}</span>
                <span className="relative mt-1 text-lg font-semibold break-all transition-colors duration-500 group-hover:text-bg">{value}</span>
                <span className="relative mt-3 text-xs text-muted transition-colors duration-500 group-hover:text-bg/60">{note}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="container-page mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <section aria-labelledby="message-heading" className="enter-rise relative rounded-panel bg-surface p-6 ring-1 ring-line sm:p-10" style={delay(700)}>
          <div className="pointer-events-none absolute -top-px right-10 left-10 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
          <p className="eyebrow">Write to us</p>
          <h2 id="message-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Send a message</h2>
          <p className="mt-2 text-muted">Tell us what you&apos;re looking for. The more detail, the better we can help.</p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </section>

        <aside className="space-y-5">
          <Reveal delay={0.1}>
            <OpeningHours />
          </Reveal>

          <Reveal delay={0.2}>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-panel bg-surface ring-1 ring-line"
            >
              <div className="aspect-[2/1] overflow-hidden">
                <div className="h-full transition-transform duration-[1.2s] ease-out group-hover:scale-110">
                  <StreetPlan />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold">{settings.address}</p>
                  <p className="text-sm text-muted">Get directions</p>
                </div>
                <ArrowUpRight aria-hidden className="size-5 text-muted transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-accent" />
              </div>
            </a>
          </Reveal>

          <Reveal delay={0.3}>
            <Link href="/faq" className="group flex items-center gap-4 rounded-panel bg-surface-2 p-5 transition-colors duration-500 hover:bg-surface">
              <span className="grid size-11 place-items-center rounded-2xl bg-surface text-accent transition-transform duration-500 group-hover:rotate-12">
                <HelpCircle className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">Quick answer?</span>
                <span className="block text-sm text-muted">Delivery, returns and care are covered in our FAQ.</span>
              </span>
              <ArrowUpRight aria-hidden className="size-5 text-muted transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </Reveal>
        </aside>
      </div>
    </>
  );
}
