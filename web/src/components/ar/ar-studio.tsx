"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Smartphone } from "lucide-react";
import { ModelViewer } from "@/components/product/model-viewer";
import type { ProductDetail } from "@/lib/data/products";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";

/** Pick a 3D product and view it, or place it in the room on a phone. */
export function ArStudio({ products }: { products: ProductDetail[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const add = useCart((state) => state.add);

  const fromUrl = products.find((p) => p.slug === searchParams.get("product"));
  const [selected, setSelected] = useState<ProductDetail | undefined>(fromUrl ?? products[0]);

  if (!selected) {
    return <p className="rounded-card bg-surface-2 px-6 py-16 text-center text-muted">No 3D models are available yet.</p>;
  }

  function choose(product: ProductDetail) {
    setSelected(product);
    router.replace(`${pathname}?product=${product.slug}`, { scroll: false });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <div className="relative overflow-hidden rounded-panel">
          <ModelViewer
            key={selected.id}
            src={selected.modelUrl!}
            poster={selected.image}
            alt={`3D model of ${selected.name}`}
            className="aspect-[4/3] h-auto w-full sm:aspect-[16/10]"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/shop/${selected.slug}`} className="font-display text-2xl hover:text-accent">
              {selected.name}
            </Link>
            <p className="mt-1 text-sm text-muted tabular-nums">
              {formatPrice(selected.price)}
              {selected.dimensions &&
                ` · ${selected.dimensions.length} × ${selected.dimensions.width} × ${selected.dimensions.height} ${selected.dimensions.unit}`}
            </p>
          </div>
          <Button
            disabled={!selected.inStock}
            onClick={() =>
              add({
                id: selected.id,
                slug: selected.slug,
                name: selected.name,
                price: selected.price,
                image: selected.image,
              })
            }
          >
            {selected.inStock ? "Add to cart" : "Sold out"}
          </Button>
        </div>

        <p className="mt-5 flex items-start gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          Drag to rotate and pinch to zoom. On an Android phone or iPhone, tap “View in your room” to place
          the piece on your floor at real size. AR is not available on computers.
        </p>
      </div>

      <div>
        <h2 className="eyebrow">Choose a piece</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          {products.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => choose(product)}
                aria-pressed={product.id === selected.id}
                className={cn(
                  "w-full rounded-2xl p-2 text-left ring-2 transition",
                  product.id === selected.id ? "bg-surface ring-accent" : "ring-transparent hover:bg-surface",
                )}
              >
                <span className="relative block aspect-square overflow-hidden rounded-xl bg-surface-2">
                  {product.image && (
                    <Image src={product.image} alt="" fill sizes="160px" className="object-contain p-2" />
                  )}
                </span>
                <span className="mt-2 block truncate px-1 text-sm font-medium">{product.name}</span>
                <span className="block px-1 text-xs text-muted tabular-nums">{formatPrice(product.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
