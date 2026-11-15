"use client";

import { createElement, useEffect, useState } from "react";
import { Box, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

type ModelViewerProps = {
  /** URL of the .glb file. */
  src: string;
  /** Image shown until the model has loaded. */
  poster?: string | null;
  alt: string;
  className?: string;
  /** Spin slowly until the visitor touches it. */
  autoRotate?: boolean;
};

/**
 * Interactive 3D model with a "View in your room" button.
 *
 * Uses Google's <model-viewer> web component. On phones the button opens the
 * device's AR viewer (Scene Viewer on Android, Quick Look on iPhone); on
 * computers, which have no AR, the button is hidden automatically.
 *
 * The library is large, so it is downloaded only when a viewer is on screen.
 */
export function ModelViewer({
  src,
  poster,
  alt,
  className,
  autoRotate = true,
}: ModelViewerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").then(({ ModelViewerElement }) => {
      // Our .glb files are meshopt-compressed. model-viewer has no default
      // decoder, so point it at the copy we serve ourselves (from the
      // meshoptimizer package) instead of a third-party CDN.
      if (!ModelViewerElement.meshoptDecoderLocation) {
        ModelViewerElement.meshoptDecoderLocation = "/vendor/meshopt_decoder.js";
      }
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div
        className={cn(
          "grid h-auto place-items-center bg-surface-2 text-muted",
          className,
        )}
      >
        <span className="flex items-center gap-2 text-sm">
          <Box className="size-4 animate-pulse" aria-hidden />
          Loading 3D view…
        </span>
      </div>
    );
  }

  // <model-viewer> is a custom element, so it is created with createElement
  // and its options are plain HTML attributes.
  return createElement(
    "model-viewer",
    {
      src,
      poster: poster ?? undefined,
      alt,
      ar: "",
      "ar-modes": "webxr scene-viewer quick-look",
      "ar-scale": "fixed",
      "camera-controls": "",
      "touch-action": "pan-y",
      "shadow-intensity": "1",
      "environment-image": "neutral",
      "interaction-prompt": "auto",
      loading: "lazy",
      ...(autoRotate ? { "auto-rotate": "", "auto-rotate-delay": "1200" } : {}),
      className: cn("block bg-surface-2", className),
      style: { "--poster-color": "transparent" } as React.CSSProperties,
    },
    createElement(
      "button",
      {
        slot: "ar-button",
        type: "button",
        className:
          "absolute right-4 bottom-4 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink shadow-lg",
      },
      createElement(ScanLine, { className: "size-4", "aria-hidden": true }),
      "View in your room",
    ),
  );
}
