import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { faqGroups } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about delivery, shipping costs, assembly, returns, payment, custom furniture and the AR preview.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqGroups.flatMap((g) =>
      g.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHeader
        eyebrow="Help centre"
        title={<>Questions, <em className="text-gradient">answered</em></>}
        description="Delivery, returns, payment, custom pieces and the AR preview. Can't find what you need? We're a message away."
        crumbs={[{ label: "FAQ" }]}
      />

      <div className="container-page grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-14">
          {faqGroups.map((group) => (
            <section key={group.title}>
              <h2 className="font-display text-2xl font-medium">{group.title}</h2>
              <div className="mt-4 border-t border-line">
                {group.items.map((item) => (
                  <details key={item.q} className="group border-b border-line">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-medium [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="max-w-2xl pb-6 leading-relaxed text-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-panel bg-inverse p-7 text-inverse-ink">
            <h2 className="font-display text-2xl">Still need help?</h2>
            <p className="mt-3 text-sm leading-relaxed text-inverse-muted">
              Our team helps with choosing pieces, custom requests and anything after you buy.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="size-4" aria-hidden />
                <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`}>{site.contact.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4" aria-hidden />
                <a href={`mailto:${site.contact.email}`} className="break-all">{site.contact.email}</a>
              </li>
            </ul>
            <Link href="/contact" className={buttonStyles({ variant: "inverse", className: "mt-7 w-full" })}>
              Send us a message
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
