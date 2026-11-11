import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, PackageCheck, RotateCcw, ScanLine, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { Stars } from "@/components/ui/stars";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
  type ProductDetail,
} from "@/lib/data/products";
import { getProductReviews } from "@/lib/data/reviews";
import { FREE_SHIPPING_FROM, SHIPPING_FEE } from "@/lib/pricing";
import { categories, site } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

type Props = PageProps<"/shop/[slug]">;

/** Build a page for every product ahead of time. New products render on first visit. */
export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Product not found" };

  const description =
    product.seoDescription || product.shortDescription || product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function Detail({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <div className="pb-6 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

async function Reviews({ product }: { product: ProductDetail }) {
  const { reviews, average, count, breakdown } = await getProductReviews(product.id);

  return (
    <section id="reviews" className="container-page mt-24 scroll-mt-24">
      <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Customer reviews
      </h2>

      {count === 0 ? (
        <p className="mt-6 max-w-xl text-muted">
          No reviews yet. Once this piece has been delivered to you, you can review it
          from <Link href="/account/orders" className="underline underline-offset-4 hover:text-accent">your orders</Link>.
        </p>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="font-display text-6xl font-medium tabular-nums">{average.toFixed(1)}</p>
            <Stars rating={average} size="md" className="mt-2" />
            <p className="mt-2 text-sm text-muted">
              Based on {count} {count === 1 ? "review" : "reviews"}
            </p>

            <ul className="mt-6 space-y-2">
              {breakdown.map((row) => (
                <li key={row.stars} className="flex items-center gap-3 text-sm tabular-nums">
                  <span className="w-12 shrink-0 text-muted">{row.stars} star</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${(row.count / count) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right text-muted">{row.count}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm text-muted">
              Bought this piece? Review it from{" "}
              <Link href="/account/orders" className="underline underline-offset-4 hover:text-accent">
                your orders
              </Link>
              .
            </p>
          </div>

          <ul className="divide-y divide-line border-t border-line">
            {reviews.slice(0, 12).map((review) => (
              <li key={review.id} className="py-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars rating={review.rating} />
                  <time dateTime={review.date} className="text-sm text-muted">
                    {dateFormat.format(new Date(review.date))}
                  </time>
                </div>
                {review.comment && <p className="mt-3 leading-relaxed">{review.comment}</p>}
                <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                  {review.author}
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 text-sage">
                      <BadgeCheck className="size-4" aria-hidden />
                      Verified purchase
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

async function ProductContent({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category, product.id);
  const category = categories.find((c) => c.slug === product.category);
  const saving = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Structured data so search engines can show price, stock and rating.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.gallery,
    sku: product.sku || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.ratingCount,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="container-page pt-8 sm:pt-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5" aria-hidden />
              <Link href="/shop" className="hover:text-ink">Shop</Link>
            </li>
            {category && (
              <li className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5" aria-hidden />
                <Link href={`/shop?category=${category.slug}`} className="hover:text-ink">
                  {category.label}
                </Link>
              </li>
            )}
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery
              productId={product.id}
              name={product.name}
              images={product.gallery}
              modelUrl={product.modelUrl}
            />
          </div>

          <div>
            {product.brand && <p className="eyebrow">{product.brand}</p>}
            <h1 className="mt-3 font-display text-4xl leading-tight font-medium tracking-tight sm:text-5xl">
              {product.name}
            </h1>

            {product.ratingCount > 0 && (
              <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-sm hover:text-accent">
                <Stars rating={product.rating} />
                <span className="tabular-nums">{product.rating.toFixed(1)}</span>
                <span className="text-muted">
                  ({product.ratingCount} {product.ratingCount === 1 ? "review" : "reviews"})
                </span>
              </a>
            )}

            <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
              <span className="font-display text-4xl font-medium">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="rounded-full bg-sage/15 px-3 py-1 text-sm font-semibold text-sage">
                    Save {saving}%
                  </span>
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-muted">Price excludes 18% GST, added at checkout.</p>

            {product.shortDescription && (
              <p className="mt-6 text-lg leading-relaxed text-muted">{product.shortDescription}</p>
            )}

            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium">Finish</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <li key={color} className="rounded-full border border-line px-4 py-1.5 text-sm">
                      {color}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8">
              <PurchasePanel product={product} stock={product.stock} />
            </div>

            {product.modelUrl && (
              <Link
                href={`/ar/live?product=${product.slug}`}
                className="mt-4 flex items-center gap-3 rounded-2xl bg-inverse px-5 py-4 text-inverse-ink transition-opacity hover:opacity-90"
              >
                <ScanLine className="size-5 shrink-0" aria-hidden />
                <span className="text-sm">
                  <span className="font-medium">See it in your room.</span>{" "}
                  <span className="text-inverse-muted">Open on your phone to place it with AR.</span>
                </span>
                <ChevronRight className="ml-auto size-4 shrink-0" aria-hidden />
              </Link>
            )}

            <ul className="mt-8 grid gap-4 border-t border-line pt-8 text-sm sm:grid-cols-3">
              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <span>
                  {product.price >= FREE_SHIPPING_FROM
                    ? "Free delivery on this piece"
                    : `Delivery ${formatPrice(SHIPPING_FEE)}, free over ${formatPrice(FREE_SHIPPING_FROM)}`}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <PackageCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <span>Arrives in 7 to 14 business days</span>
              </li>
              <li className="flex items-start gap-3">
                <RotateCcw className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <span>7-day returns on unused items</span>
              </li>
            </ul>

            <div className="mt-8 border-t border-line">
              {product.description && (
                <Detail title="Description" open>
                  <p className="whitespace-pre-line">{product.description}</p>
                </Detail>
              )}
              {(product.dimensions || product.material || product.sku) && (
                <Detail title="Size and materials">
                  <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-y-2">
                    {product.dimensions && (
                      <>
                        <dt>Size (L × W × H)</dt>
                        <dd className="text-ink tabular-nums">
                          {product.dimensions.length} × {product.dimensions.width} ×{" "}
                          {product.dimensions.height} {product.dimensions.unit}
                        </dd>
                      </>
                    )}
                    {product.material && (
                      <>
                        <dt>Material</dt>
                        <dd className="text-ink">{product.material}</dd>
                      </>
                    )}
                    {product.sku && (
                      <>
                        <dt>SKU</dt>
                        <dd className="text-ink">{product.sku}</dd>
                      </>
                    )}
                  </dl>
                </Detail>
              )}
              <Detail title="Delivery and returns">
                <p>
                  Most orders are delivered within 7 to 14 business days, and our team helps
                  with assembly in serviceable areas. Unused, undamaged items can be returned
                  within 7 days of delivery. Questions? Call {site.contact.phone}.
                </p>
              </Detail>
            </div>
          </div>
        </div>
      </div>

      <Reviews product={product} />

      {related.length > 0 && (
        <section className="container-page mt-24">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            You may also like
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                sizes="(min-width: 1024px) 22vw, 46vw"
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 pt-16 lg:grid-cols-2 lg:gap-16">
      <div className="aspect-square animate-pulse rounded-panel bg-surface-2" />
      <div className="space-y-5">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
        <div className="h-12 w-4/5 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-40 animate-pulse rounded bg-surface-2" />
        <div className="h-24 animate-pulse rounded bg-surface-2" />
        <div className="h-12 w-64 animate-pulse rounded-full bg-surface-2" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}
