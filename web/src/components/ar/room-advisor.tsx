"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageUp, LoaderCircle, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { FormMessage, Textarea } from "@/components/ui/field";
import type { ProductSummary } from "@/lib/data/products";

type AdvisorResult = {
  isRoom: boolean;
  summary: string;
  style: string;
  palette: string[];
  recommendations: { product: ProductSummary; reason: string }[];
};

const MAX_SIDE = 1600;

/** Shrink big phone photos before upload: faster, and stays under the 4 MB limit. */
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("resize failed"))), "image/jpeg", 0.85),
  );
}

/** Upload a room photo and get AI furniture suggestions from the catalogue. */
export function RoomAdvisor() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AdvisorResult | null>(null);

  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = "";
    if (!chosen) return;
    if (!chosen.type.startsWith("image/")) {
      setError("Please choose a photo.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
    setResult(null);
    setError("");
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setResult(null);
    setError("");
  }

  async function analyse() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const body = new FormData();
      body.append("image", await resizeImage(file), "room.jpg");
      body.append("notes", notes);
      const response = await fetch("/api/room-advisor", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setResult(data as AdvisorResult);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-14">
      <div className="space-y-4">
        {preview ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-2">
            <Image src={preview} alt="Your room" fill unoptimized className="object-cover" />
            <button
              type="button"
              onClick={reset}
              aria-label="Remove photo"
              className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/60 text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-line bg-surface text-center transition-colors hover:border-accent">
            <ImageUp className="size-8 text-accent" aria-hidden />
            <span className="font-medium">Upload a photo of your room</span>
            <span className="text-sm text-muted">or take one with your phone camera</span>
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick} />
          </label>
        )}

        <div>
          <label htmlFor="room-notes" className="text-sm font-medium">
            Anything we should know? <span className="font-normal text-muted">(optional)</span>
          </label>
          <Textarea
            id="room-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            placeholder="Looking for a sofa under ₹50,000 for a small living room"
            className="mt-1.5 min-h-20"
          />
        </div>

        <Button size="lg" className="w-full" disabled={!file || loading} onClick={analyse}>
          {loading ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {loading ? "Studying your room…" : "Suggest furniture"}
        </Button>
        <FormMessage>{error}</FormMessage>
        <p className="text-xs text-muted">
          Your photo is sent to our AI service only to make suggestions and is not stored.
        </p>
      </div>

      <div aria-live="polite">
        {!result && !loading && (
          <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-card bg-surface-2 px-6 text-center">
            <Sparkles className="size-8 text-accent" aria-hidden />
            <p className="mt-4 max-w-sm text-muted">
              Suggestions appear here: the style of your room, its colours, and the pieces from our
              collection that suit it.
            </p>
          </div>
        )}
        {loading && <div className="h-full min-h-64 animate-pulse rounded-card bg-surface-2" />}
        {result && (
          <div>
            {result.style && <p className="eyebrow">{result.style}</p>}
            <p className="mt-3 text-lg leading-relaxed">{result.summary}</p>
            {result.palette.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {result.palette.map((colour) => (
                  <li key={colour} className="rounded-full border border-line px-3 py-1 text-sm capitalize">
                    {colour}
                  </li>
                ))}
              </ul>
            )}
            {result.recommendations.length > 0 && (
              <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-3">
                {result.recommendations.map(({ product, reason }) => (
                  <li key={product.id}>
                    <ProductCard product={product} sizes="(min-width: 1280px) 20vw, 40vw" />
                    {reason && <p className="mt-2 text-sm text-muted">{reason}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
