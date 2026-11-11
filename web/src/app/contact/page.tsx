import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { PageHeader } from "@/components/layout/page-header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about an order, custom furniture or choosing the right piece? Send us a message or call our team in Ahmedabad.",
};

const hours = [
  ["Monday to Friday", "9:00 AM – 8:00 PM"],
  ["Saturday", "10:00 AM – 6:00 PM"],
  ["Sunday", "Closed"],
];

export default function ContactPage() {
  const details = [
    { icon: MapPin, label: "Visit", value: site.contact.address },
    { icon: Phone, label: "Call", value: site.contact.phone, href: `tel:${site.contact.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: site.contact.email, href: `mailto:${site.contact.email}` },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title={<>Let&apos;s talk about <em className="text-gradient">your home</em></>}
        description="Questions about an order, a custom piece or what will suit your room. We usually reply within one working day."
        crumbs={[{ label: "Contact" }]}
      />

      <div className="container-page grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
        <section aria-label="Send a message" className="relative">
          <ContactForm />
        </section>

        <aside className="space-y-10">
          <ul className="space-y-6">
            {details.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-muted">{label}</p>
                  {href ? (
                    <a href={href} className="font-medium break-all hover:text-accent">{value}</a>
                  ) : (
                    <p className="font-medium">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-panel bg-surface p-6 ring-1 ring-line">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <Clock className="size-5 text-accent" aria-hidden />
              Opening hours
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              {hours.map(([day, time]) => (
                <div key={day} className="flex justify-between gap-4">
                  <dt className="text-muted">{day}</dt>
                  <dd className="tabular-nums">{time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}
