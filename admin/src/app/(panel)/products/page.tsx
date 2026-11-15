import type { Metadata } from "next";
import Link from "next/link";
import { Box, Plus, Search } from "lucide-react";
import { PageTitle } from "@/components/panel/page-title";
import { DeleteProductButton, ProductActiveToggle } from "@/components/panel/row-actions";
import { buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth";
import { getAdminProducts } from "@/lib/data/shop";
import { cn, formatPrice, shopUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  await requireAdmin();
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 60) ?? "";
  const products = await getAdminProducts(q || undefined);

  return (
    <div>
      <PageTitle title="Products" description={`${products.length} products`}>
        <Link href="/products/new" className={buttonStyles()}>
          <Plus aria-hidden />
          New product
        </Link>
      </PageTitle>

      <form role="search" className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input name="q" type="search" defaultValue={q} placeholder="Search by name" aria-label="Search products" className="pl-11" />
      </form>

      <div className="relative overflow-x-auto rounded-card ring-1 ring-line">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-surface-2 text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">In shop</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" loading="lazy" className="size-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/products/${p.id}`} className="font-medium hover:text-accent">
                        {p.name}
                      </Link>
                      <p className="flex items-center gap-2 text-xs text-muted">
                        {p.featured && <span>Featured</span>}
                        {p.has3d && (
                          <span className="inline-flex items-center gap-1">
                            <Box className="size-3" aria-hidden />
                            3D
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{p.category}</td>
                <td className="px-4 py-3 tabular-nums">{formatPrice(p.price)}</td>
                <td className={cn("px-4 py-3 tabular-nums", p.stock <= 3 && "font-semibold text-accent")}>{p.stock}</td>
                <td className="px-4 py-3">
                  <ProductActiveToggle id={p.id} active={p.active} name={p.name} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={shopUrl(`/shop/${p.slug}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline underline-offset-4 hover:text-accent"
                    >
                      View
                    </a>
                    <Link href={`/products/${p.id}`} className="text-xs underline underline-offset-4 hover:text-accent">
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
