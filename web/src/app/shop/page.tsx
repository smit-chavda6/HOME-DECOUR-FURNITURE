import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Box, ChevronLeft, ChevronRight, SearchX, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ProductCard, ProductCardSkeleton } from "@/components/product/product-card";
import { SortSelect } from "@/components/shop/sort-select";
import { buttonStyles } from "@/components/ui/button";
import { getCategoryCounts, listProducts } from "@/lib/data/products";
import { categories } from "@/lib/site";
import { PRICE_BANDS, isSortValue } from "@/lib/sort-options";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop furniture",
  description:
    "Browse sofas, chairs, tables, beds and office furniture. Filter by category and price, and preview selected pieces in 3D.",
};

type Params = {
  category?: string;
  q?: string;
  sort?: string;
  price?: string;
  view?: string;
  page?: string;
};

/** Read one value from the URL query (ignores repeated keys). */
function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Build a /shop link that keeps the current filters and applies `changes`. */
function shopHref(current: Params, changes: Partial<Params>) {
  const next: Params = { ...current, page: undefined, ...changes };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-ink font-medium text-bg" : "hover:bg-surface-2",
      )}
    >
      {children}
    </Link>
  );
}

async function ShopContent({
  searchParams,
}: {
  searchParams: PageProps<"/shop">["searchParams"];
}) {
  const raw = await searchParams;
  const category = categories.find((c) => c.slug === one(raw.category))?.slug;
  const band = PRICE_BANDS.find((b) => b.value === one(raw.price));
  const sort = isSortValue(one(raw.sort)) ? (one(raw.sort) as string) : "featured";
  const q = one(raw.q)?.trim().slice(0, 60) || undefined;
  const only3d = one(raw.view) === "3d";
  const page = Math.max(Number.parseInt(one(raw.page) ?? "1", 10) || 1, 1);

  const current: Params = {
    category,
    q,
    sort: sort === "featured" ? undefined : sort,
    price: band?.value,
    view: only3d ? "3d" : undefined,
  };

  const [result, counts] = await Promise.all([
    listProducts({
      category,
      q,
      sort: isSortValue(sort) ? sort : "featured",
      minPrice: band?.min,
      maxPrice: band?.max,
      only3d,
      page,
    }),
    getCategoryCounts(),
  ]);

  const totalCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const hasFilters = Boolean(category || q || band || only3d);

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-10 pb-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
      {/* Filters: a sidebar on large screens, stacked above the grid on phones. */}
      <aside aria-label="Filters" className="space-y-8 lg:sticky lg:top-24 lg:self-start">
        <div>
          <h2 className="eyebrow">Category</h2>
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            <li className="shrink-0">
              <FilterLink href={shopHref(current, { category: undefined })} active={!category}>
                All furniture
                <span className="ml-3 text-xs opacity-70">{totalCount}</span>
              </FilterLink>
            </li>
            {categories.map((c) => (
              <li key={c.slug} className="shrink-0">
                <FilterLink
                  href={shopHref(current, { category: c.slug })}
                  active={category === c.slug}
                >
                  {c.label}
                  <span className="ml-3 text-xs opacity-70">{counts[c.slug] ?? 0}</span>
                </FilterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">Price</h2>
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {PRICE_BANDS.map((b) => (
              <li key={b.value} className="shrink-0">
                <FilterLink
                  href={shopHref(current, {
                    price: band?.value === b.value ? undefined : b.value,
                  })}
                  active={band?.value === b.value}
                >
                  {b.label}
                </FilterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">Preview</h2>
          <div className="mt-3">
            <FilterLink
              href={shopHref(current, { view: only3d ? undefined : "3d" })}
              active={only3d}
            >
              <span className="flex items-center gap-2">
                <Box className="size-4" aria-hidden />
                Available in 3D / AR
              </span>
            </FilterLink>
          </div>
        </div>
      </aside>

      <section aria-label="Products">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <p className="mr-2 text-muted" aria-live="polite">
              {result.total} {result.total === 1 ? "piece" : "pieces"}
            </p>
            {q && (
              <Link
                href={shopHref(current, { q: undefined })}
                scroll={false}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 hover:border-ink"
              >
                “{q}”
                <X className="size-3.5" aria-label="Remove search" />
              </Link>
            )}
            {hasFilters && (
              <Link href="/shop" scroll={false} className="underline underline-offset-4 hover:text-accent">
                Clear all
              </Link>
            )}
          </div>
          <SortSelect value={sort} />
        </div>

        {result.products.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-surface-2 text-muted">
              <SearchX className="size-7" aria-hidden />
            </span>
            <h2 className="mt-6 font-display text-2xl">Nothing matches those filters</h2>
            <p className="mt-2 max-w-sm text-muted">
              Try a different category or price range, or clear the filters to see everything.
            </p>
            <Link href="/shop" className={buttonStyles({ className: "mt-6" })}>
              See all furniture
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-3">
            {result.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 36vw, 46vw"
              />
            ))}
          </div>
        )}

        {result.pageCount > 1 && (
          <nav aria-label="Pages" className="mt-14 flex items-center justify-center gap-2">
            <Link
              href={shopHref(current, { page: page > 2 ? String(page - 1) : undefined })}
              aria-disabled={page <= 1}
              className={buttonStyles({
                variant: "outline",
                size: "icon",
                className: page <= 1 ? "pointer-events-none opacity-40" : "",
              })}
            >
              <ChevronLeft aria-label="Previous page" />
            </Link>
            {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={shopHref(current, { page: n > 1 ? String(n) : undefined })}
                aria-current={n === result.page ? "page" : undefined}
                className={cn(
                  "grid size-10 place-items-center rounded-full text-sm tabular-nums transition-colors",
                  n === result.page ? "bg-ink font-medium text-bg" : "hover:bg-surface-2",
                )}
              >
                {n}
              </Link>
            ))}
            <Link
              href={shopHref(current, { page: String(page + 1) })}
              aria-disabled={page >= result.pageCount}
              className={buttonStyles({
                variant: "outline",
                size: "icon",
                className: page >= result.pageCount ? "pointer-events-none opacity-40" : "",
              })}
            >
              <ChevronRight aria-label="Next page" />
            </Link>
          </nav>
        )}
      </section>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div className="container-page grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
      <div className="hidden h-96 animate-pulse rounded-card bg-surface-2 lg:block" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <>
      <PageHeader
        eyebrow="The collection"
        title={<>The <em className="text-gradient">collection</em></>}
        description="Every piece in one place. Filter by room, budget or 3D preview to find the one that fits."
        crumbs={[{ label: "Shop" }]}
      />
      {/* Filters come from the URL, so this part renders per request. */}
      <Suspense fallback={<ShopSkeleton />}>
        <ShopContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
