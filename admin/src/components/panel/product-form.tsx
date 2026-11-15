"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Box, Eye, ImageIcon, IndianRupee, Package, Ruler, Sparkles } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveProductAction } from "@/lib/actions/shop";
import type { ProductFormValues } from "@/lib/data/shop";
import { assetUrl, cn, formatPrice } from "@/lib/utils";
import type { FormState } from "@/lib/validation";
import { ImageField } from "./image-field";

const empty: Omit<ProductFormValues, "id" | "slug"> = {
  name: "",
  category: "",
  brand: "",
  shortDescription: "",
  description: "",
  price: "",
  originalPrice: "",
  stock: "0",
  badge: "",
  material: "",
  length: "0",
  width: "0",
  height: "0",
  colors: "",
  thumbnail: "",
  gallery: "",
  modelUrl: "",
  isFeatured: false,
  isTrending: false,
  isNewArrival: false,
  isActive: true,
};

/** A titled group of fields inside the form. */
function Group({
  icon: Icon,
  title,
  hint,
  children,
  className,
}: {
  icon: typeof Package;
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card bg-surface p-5 ring-1 ring-line sm:p-6", className)}>
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

type Preview = { name: string; category: string; price: string; originalPrice: string; badge: string; stock: string; thumbnail: string; modelUrl: string };

/** How the product will look as a card in the shop, updated as you type. */
function PreviewCard({ p }: { p: Preview }) {
  const img = assetUrl(p.thumbnail);
  const price = Number(p.price) || 0;
  const was = Number(p.originalPrice) || 0;
  const stock = Number(p.stock) || 0;
  return (
    <div className="overflow-hidden rounded-card bg-surface ring-1 ring-line">
      <div className="relative aspect-[4/3] bg-surface-2">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-muted">
            <ImageIcon className="size-8" aria-hidden />
          </span>
        )}
        <span className="absolute top-3 left-3 flex gap-1.5">
          {p.badge && <span className="rounded-full bg-black/60 px-2.5 py-1 text-[0.68rem] font-medium text-white backdrop-blur">{p.badge}</span>}
          {p.modelUrl && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[0.68rem] font-medium text-white backdrop-blur">
              <Box className="size-3" aria-hidden />
              3D
            </span>
          )}
        </span>
      </div>
      <div className="p-4">
        <p className="eyebrow capitalize">{p.category || "category"}</p>
        <p className="mt-1 font-display text-lg leading-snug font-semibold tracking-tight">{p.name || "Product name"}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold text-accent tabular-nums">{price ? formatPrice(price) : "₹—"}</span>
          {was > price && <span className="text-sm text-muted line-through tabular-nums">{formatPrice(was)}</span>}
        </p>
        <p className={cn("mt-2 text-xs", stock === 0 ? "text-red-600 dark:text-red-400" : stock <= 3 ? "text-amber-600 dark:text-amber-300" : "text-muted")}>
          {stock === 0 ? "Sold out" : `${stock} in stock`}
        </p>
      </div>
    </div>
  );
}

export function ProductForm({ product }: { product?: ProductFormValues }) {
  const initial = product ?? { ...empty, id: "", slug: "" };
  const [state, action] = useActionState(saveProductAction, {} as FormState);
  const [uploading, setUploading] = useState(false);

  const e = state.errors ?? {};
  const v = (key: keyof typeof initial) => state.values?.[key] ?? String(initial[key] ?? "");
  const checked = (key: "isFeatured" | "isTrending" | "isNewArrival" | "isActive") =>
    state.values ? state.values[key] === "on" : initial[key];

  const [preview, setPreview] = useState<Preview>({
    name: v("name"),
    category: v("category"),
    price: v("price"),
    originalPrice: v("originalPrice"),
    badge: v("badge"),
    stock: v("stock"),
    thumbnail: v("thumbnail"),
    modelUrl: v("modelUrl"),
  });

  return (
    <form
      action={action}
      noValidate
      onInput={(ev) => {
        const t = ev.target as HTMLInputElement;
        if (t.name in preview) setPreview((p) => ({ ...p, [t.name]: t.value }));
      }}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="min-w-0 space-y-6">
        <input type="hidden" name="id" value={initial.id} />
        <FormMessage>{state.message}</FormMessage>

        <Group icon={Package} title="The basics" hint="Name, category and the words shoppers read.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={e.name} className="sm:col-span-2">
              <Input id="name" name="name" defaultValue={v("name")} error={e.name} required />
            </Field>
            <Field label="Category" htmlFor="category" error={e.category} hint="sofa, chair, table, bed or office">
              <Input id="category" name="category" list="categories" defaultValue={v("category")} error={e.category} required />
              <datalist id="categories">
                {["sofa", "chair", "table", "bed", "office"].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Brand" htmlFor="brand" error={e.brand} optional>
              <Input id="brand" name="brand" defaultValue={v("brand")} />
            </Field>
            <Field label="Short description" htmlFor="shortDescription" error={e.shortDescription} className="sm:col-span-2" hint="One or two sentences shown near the price.">
              <Input id="shortDescription" name="shortDescription" maxLength={300} defaultValue={v("shortDescription")} />
            </Field>
            <Field label="Full description" htmlFor="description" error={e.description} className="sm:col-span-2" optional>
              <Textarea id="description" name="description" defaultValue={v("description")} />
            </Field>
          </div>
        </Group>

        <Group icon={IndianRupee} title="Price & stock" hint="Whole rupees. A higher “Was” price shows a discount.">
          <div className="grid gap-5 sm:grid-cols-4">
            <Field label="Price (₹)" htmlFor="price" error={e.price}>
              <Input id="price" name="price" inputMode="numeric" defaultValue={v("price")} error={e.price} required />
            </Field>
            <Field label="Was (₹)" htmlFor="originalPrice" error={e.originalPrice} optional>
              <Input id="originalPrice" name="originalPrice" inputMode="numeric" defaultValue={v("originalPrice")} error={e.originalPrice} />
            </Field>
            <Field label="Stock" htmlFor="stock" error={e.stock}>
              <Input id="stock" name="stock" inputMode="numeric" defaultValue={v("stock")} error={e.stock} required />
            </Field>
            <Field label="Badge" htmlFor="badge" error={e.badge} optional>
              <Input id="badge" name="badge" placeholder="Best Seller" defaultValue={v("badge")} />
            </Field>
          </div>
        </Group>

        <Group icon={Ruler} title="Size & finish">
          <div className="grid gap-5 sm:grid-cols-6">
            <Field label="Material" htmlFor="material" error={e.material} className="sm:col-span-3" optional>
              <Input id="material" name="material" defaultValue={v("material")} />
            </Field>
            <Field label="Finishes" htmlFor="colors" error={e.colors} className="sm:col-span-3" hint="Separate with commas." optional>
              <Input id="colors" name="colors" defaultValue={v("colors")} />
            </Field>
            <Field label="Length (cm)" htmlFor="length" error={e.length} className="sm:col-span-2">
              <Input id="length" name="length" inputMode="decimal" defaultValue={v("length")} />
            </Field>
            <Field label="Width (cm)" htmlFor="width" error={e.width} className="sm:col-span-2">
              <Input id="width" name="width" inputMode="decimal" defaultValue={v("width")} />
            </Field>
            <Field label="Height (cm)" htmlFor="height" error={e.height} className="sm:col-span-2">
              <Input id="height" name="height" inputMode="decimal" defaultValue={v("height")} />
            </Field>
          </div>
        </Group>

        <Group icon={ImageIcon} title="Photos & 3D" hint="The main image appears on cards; the 3D model powers the viewer and AR.">
          <div className="space-y-5">
            <ImageField
              name="thumbnail"
              label="Main image"
              defaultValue={v("thumbnail")}
              error={e.thumbnail}
              onUploadingChange={setUploading}
              onValueChange={(thumbnail) => setPreview((p) => ({ ...p, thumbnail }))}
            />
            <Field label="More images" htmlFor="gallery" error={e.gallery} hint="One path or URL per line." optional>
              <Textarea id="gallery" name="gallery" className="min-h-20" defaultValue={v("gallery")} />
            </Field>
            <Field label="3D model (.glb)" htmlFor="modelUrl" error={e.modelUrl} hint='For example "3d models/Sofa Chair.glb". Leave empty for no 3D.' optional>
              <Input id="modelUrl" name="modelUrl" defaultValue={v("modelUrl")} />
            </Field>
          </div>
        </Group>

        <Group icon={Sparkles} title="Visibility">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["isActive", "Show in shop", "Visible to shoppers"],
                ["isFeatured", "Featured", "On the home page"],
                ["isNewArrival", "New arrival", "In the new-arrivals row"],
                ["isTrending", "Trending", "Highlighted as popular"],
              ] as const
            ).map(([name, label, sub]) => (
              <label
                key={name}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-[var(--field)] px-4 py-3 text-sm transition has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10"
              >
                <input type="checkbox" name={name} defaultChecked={checked(name)} className="size-4 accent-[var(--accent)]" />
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs text-muted">{sub}</span>
                </span>
              </label>
            ))}
          </div>
        </Group>

        <div className="glass sticky bottom-3 z-10 !bg-surface-solid/90 shadow-[var(--shadow-lift)] flex flex-wrap items-center gap-3 rounded-full p-2">
          <SubmitButton size="lg" pendingText="Saving…" disabled={uploading}>
            {initial.id ? "Save product" : "Create product"}
          </SubmitButton>
          <Link href="/products" className={buttonStyles({ variant: "ghost", size: "lg" })}>
            Cancel
          </Link>
        </div>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Eye className="size-3.5" aria-hidden />
          Live preview
        </p>
        <PreviewCard p={preview} />
        <p className="mt-3 text-xs text-muted">How this piece looks as a card in the shop. Saves only when you press Save.</p>
      </aside>
    </form>
  );
}
