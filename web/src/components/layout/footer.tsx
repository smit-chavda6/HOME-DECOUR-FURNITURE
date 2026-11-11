import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { categories, site } from "@/lib/site";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "All furniture", href: "/shop" },
      ...categories.map((c) => ({ label: c.label, href: `/shop?category=${c.slug}` })),
    ],
  },
  {
    title: "Experience",
    links: [
      { label: "AR Studio", href: "/ar" },
      { label: "Live AR room", href: "/ar/live" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Your account", href: "/account" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Journal", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line">
      <div className="spotlight pointer-events-none absolute inset-0 opacity-70 [--x:50%] [--y:100%]" />

      <div className="relative container-page pt-20 pb-10">
        <div className="flex flex-col items-start justify-between gap-8 border-b border-line pb-14 lg:flex-row lg:items-end">
          <h2 className="max-w-2xl text-4xl leading-[1.05] font-semibold sm:text-6xl">
            Make your home feel <em className="text-gradient">unmistakably</em> yours.
          </h2>
          <Link href="/shop" className={buttonStyles({ size: "lg" })}>
            Explore the collection
            <ArrowUpRight aria-hidden />
          </Link>
        </div>

        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Furniture made for modern living since 2014. Preview every piece in 3D and place it in
              your own room before you buy.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <MapPin className="size-4 text-accent" aria-hidden />
                {site.contact.address}
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 text-accent" aria-hidden />
                <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="hover:text-accent">
                  {site.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 text-accent" aria-hidden />
                <a href={`mailto:${site.contact.email}`} className="break-all hover:text-accent">
                  {site.contact.email}
                </a>
              </li>
            </ul>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">{column.title}</h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm transition-colors hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Oversized wordmark, fading into the page. */}
        <p
          aria-hidden
          className="pointer-events-none -mb-6 bg-gradient-to-b from-ink/25 to-transparent bg-clip-text text-center text-[17vw] leading-none font-semibold tracking-[-0.07em] text-transparent select-none lg:-mb-10"
        >
          Home Decor
        </p>

        <div className="relative flex flex-col gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {site.name}. Crafted in Ahmedabad.</p>
          <ul className="flex gap-6">
            <li><Link href="/privacy" className="hover:text-ink">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-ink">Terms</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
