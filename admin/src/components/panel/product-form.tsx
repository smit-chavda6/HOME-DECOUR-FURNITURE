"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveProductAction } from "@/lib/actions/shop";
import type { ProductFormValues } from "@/lib/data/shop";
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

export function ProductForm({ product }: { product?: ProductFormValues }) {
  const initial = product ?? { ...empty, id: "", slug: "" };
  const [state, action] = useActionState(saveProductAction, {} as FormState);
  const [uploading, setUploading] = useState(false);

  const e = state.errors ?? {};
  const v = (key: keyof typeof initial) => state.values?.[key] ?? String(initial[key] ?? "");
  const checked = (key: "isFeatured" | "isTrending" | "isNewArrival" | "isActive") =>
    state.values ? state.values[key] === "on" : initial[key];

  return (
    <form action={action} className="space-y-10" noValidate>
      <input type="hidden" name="id" value={initial.id} />
      <FormMessage>{state.message}</FormMessage>

      <section className="grid gap-5 sm:grid-cols-2">
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
        <Field
          label="Short description"
          htmlFor="shortDescription"
          error={e.shortDescription}
          className="sm:col-span-2"
          hint="One or two sentences shown near the price."
        >
          <Input id="shortDescription" name="shortDescription" maxLength={300} defaultValue={v("shortDescription")} />
        </Field>
        <Field label="Full description" htmlFor="description" error={e.description} className="sm:col-span-2" optional>
          <Textarea id="description" name="description" defaultValue={v("description")} />
        </Field>
      </section>

      <section className="grid gap-5 border-t border-line pt-10 sm:grid-cols-4">
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
        <Field label="Material" htmlFor="material" error={e.material} className="sm:col-span-2" optional>
          <Input id="material" name="material" defaultValue={v("material")} />
        </Field>
        <Field label="Finishes" htmlFor="colors" error={e.colors} className="sm:col-span-2" hint="Separate with commas." optional>
          <Input id="colors" name="colors" defaultValue={v("colors")} />
        </Field>
        <Field label="Length (cm)" htmlFor="length" error={e.length}>
          <Input id="length" name="length" inputMode="decimal" defaultValue={v("length")} />
        </Field>
        <Field label="Width (cm)" htmlFor="width" error={e.width}>
          <Input id="width" name="width" inputMode="decimal" defaultValue={v("width")} />
        </Field>
        <Field label="Height (cm)" htmlFor="height" error={e.height}>
          <Input id="height" name="height" inputMode="decimal" defaultValue={v("height")} />
        </Field>
      </section>

      <section className="space-y-5 border-t border-line pt-10">
        <ImageField
          name="thumbnail"
          label="Main image"
          defaultValue={v("thumbnail")}
          error={e.thumbnail}
          onUploadingChange={setUploading}
        />
        <Field label="More images" htmlFor="gallery" error={e.gallery} hint="One path or URL per line." optional>
          <Textarea id="gallery" name="gallery" className="min-h-20" defaultValue={v("gallery")} />
        </Field>
        <Field
          label="3D model (.glb)"
          htmlFor="modelUrl"
          error={e.modelUrl}
          hint='For example "3d models/Sofa Chair.glb". Leave empty for no 3D.'
          optional
        >
          <Input id="modelUrl" name="modelUrl" defaultValue={v("modelUrl")} />
        </Field>
      </section>

      <fieldset className="grid gap-3 border-t border-line pt-10 sm:grid-cols-4">
        <legend className="mb-3 text-sm font-medium">Visibility</legend>
        {(
          [
            ["isActive", "Show in shop"],
            ["isFeatured", "Featured on home page"],
            ["isNewArrival", "New arrival"],
            ["isTrending", "Trending"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm">
            <input type="checkbox" name={name} defaultChecked={checked(name)} className="size-4 accent-[var(--accent)]" />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t border-line pt-8">
        <SubmitButton size="lg" pendingText="Saving…" disabled={uploading}>
          {initial.id ? "Save product" : "Create product"}
        </SubmitButton>
        <Link href="/products" className={buttonStyles({ variant: "ghost", size: "lg" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
