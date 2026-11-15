"use client";

import { useState } from "react";
import Image from "next/image";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelViewer } from "./model-viewer";

type ProductGalleryProps = {
  name: string;
  images: string[];
  modelUrl: string | null;
};

/** Large image with thumbnails. Products with a 3D model get an extra "3D" tab. */
export function ProductGallery({ name, images, modelUrl }: ProductGalleryProps) {
  // The selected view is an image index, or "3d".
  const [view, setView] = useState<number | "3d">(0);
  const showThumbs = images.length > 1 || Boolean(modelUrl);

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {showThumbs && (
        <ul className="flex gap-3 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
          {images.map((src, index) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setView(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-pressed={view === index}
                className={cn(
                  "relative block size-20 overflow-hidden rounded-xl bg-surface-2 ring-2 ring-offset-2 ring-offset-bg transition",
                  view === index ? "ring-accent" : "ring-transparent hover:ring-line",
                )}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
          {modelUrl && (
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => setView("3d")}
                aria-pressed={view === "3d"}
                className={cn(
                  "flex size-20 flex-col items-center justify-center gap-1 rounded-xl bg-inverse text-xs font-semibold text-inverse-ink ring-2 ring-offset-2 ring-offset-bg transition",
                  view === "3d" ? "ring-accent" : "ring-transparent hover:ring-line",
                )}
              >
                <Box className="size-5" aria-hidden />
                3D view
              </button>
            </li>
          )}
        </ul>
      )}

      <div className="relative aspect-square flex-1 overflow-hidden rounded-panel bg-surface-2">
        {view === "3d" && modelUrl ? (
          <ModelViewer
            src={modelUrl}
            poster={images[0]}
            alt={`3D model of ${name}`}
            className="size-full"
          />
        ) : images.length > 0 ? (
          <Image
            key={images[view as number]}
            src={images[view as number] ?? images[0]}
            alt={name}
            fill
            preload
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted">No image yet</div>
        )}
      </div>
    </div>
  );
}
