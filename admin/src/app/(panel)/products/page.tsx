import type { Metadata } from "next";
import Link from "next/link";
import { Box, ExternalLink, Package, PencilLine, Plus, Search, Sparkles } from "lucide-react";
import { DeleteProductButton, ProductActiveToggle } from "@/components/panel/row-actions";
import { EmptyState, PageHero, StatStrip } from "@/components/panel/ui";
import { buttonStyles } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getAdminProducts } from "@/lib/data/shop";
import { cn, formatPrice, shopUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 60) ?? "";
  const cat = first(sp.cat)?.trim().toLowerCase() ?? "";
  const all = await getAdminProducts(q || undefined);
  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();
  const products = cat ? all.filter((p) => p.category === cat) : all;

  const live = all.filter((p) => p.active).length;
  const low = all.filter((p) => p.stock <= 3).length;
  const with3d = all.filter((p) => p.has3d).length;
  const href = (c: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (c) params.set("cat", c);
    const s = params.toString();
    return s ? `/products?${s}` : "/products";
  };

  return (
    <div className="rise">
      <PageHero
        icon={Package}
        eyebrow="Catalogue"
        title="Your"
        accent="collection"
        description="Every piece in the shop. Switch one off to hide it instantly; edit to change price, stock, photos or its 3D model."
      >
        <Link href="/products/new" className={buttonStyles({ size: "lg" })}>
          <Plus aria-hidden />
          New product
        </Link>
      </PageHero>

      <StatStrip
        items={[
          { label: "Products", value: all.length, tone: "accent" },
          { label: "In the shop", value: live, tone: "good" },
          { label: "Low stock (≤ 3)", value: low, tone: low ? "warn" : "default" },
          { label: "With 3D & AR", value: with3d },
        ]}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form role="search" className="relative w-full max-w-xs">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <Search className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by name"
            aria-label="Search products"
            className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-sm shadow-[var(--shadow-sm)] transition focus:border-accent/60 focus:shadow-[0_0_0_4px_var(--glow)] focus:outline-none"
          />
        </form>
        <nav aria-label="Filter by category" className="flex gap-2 overflow-x-auto pb-1">
          {["", ...categories].map((c) => {
            const active = cat === c;
            return (
              <Link
                key={c || "all"}
                href={href(c)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm capitalize transition",
                  active
                    ? "border-transparent bg-accent font-medium text-accent-ink shadow-[0_8px_24px_-10px_var(--glow)]"
                    : "border-line bg-surface hover:border-accent/40 hover:text-accent",
                )}
              >
                {c || "All"}
              </Link>
            );
          })}
        </nav>
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products here" text={q ? `Nothing matches “${q}”.` : "Add your first piece to the collection."}>
          <Link href="/products/new" className={buttonStyles()}>
            <Plus aria-hidden />
            New product
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((p) => (
            <li
              key={p.id}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-card bg-surface ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] hover:ring-accent/40",
                !p.active && "opacity-70",
              )}
            >
              <Link href={`/products/${p.id}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-2">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-muted">
                    <Package className="size-8" aria-hidden />
                  </span>
                )}
                <span className="absolute top-3 left-3 flex gap-1.5">
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[0.68rem] font-medium text-white backdrop-blur">
                      <Sparkles className="size-3" aria-hidden />
                      Featured
                    </span>
                  )}
                  {p.has3d && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[0.68rem] font-medium text-white backdrop-blur">
                      <Box className="size-3" aria-hidden />
                      3D
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "absolute top-3 right-3 rounded-full px-2.5 py-1 font-mono text-[0.65rem] font-bold tracking-wider uppercase backdrop-blur",
                    p.stock === 0
                      ? "bg-red-600/85 text-white"
                      : p.stock <= 3
                        ? "bg-amber-400/90 text-amber-950"
                        : "bg-white/80 text-stone-800",
                  )}
                >
                  {p.stock === 0 ? "Sold out" : `${p.stock} in stock`}
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <p className="eyebrow capitalize">{p.category}</p>
                <Link href={`/products/${p.id}`} className="mt-1 font-display text-lg leading-snug font-semibold tracking-tight hover:text-accent">
                  {p.name}
                </Link>
                <p className="mt-1 font-display text-xl font-semibold text-accent tabular-nums">{formatPrice(p.price)}</p>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <ProductActiveToggle id={p.id} active={p.active} name={p.name} />
                    {p.active ? "In shop" : "Hidden"}
                  </span>
                  <span className="flex items-center gap-1">
                    <a
                      href={shopUrl(`/shop/${p.slug}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${p.name} in the shop`}
                      className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                    <Link
                      href={`/products/${p.id}`}
                      aria-label={`Edit ${p.name}`}
                      className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
                    >
                      <PencilLine className="size-3.5" aria-hidden />
                    </Link>
                    <DeleteProductButton id={p.id} />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
