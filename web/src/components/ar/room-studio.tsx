"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Copy,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/stores/cart";
import type { ArProduct } from "./ar-types";
import { RoomScene, type PlacedItem } from "./room-scene";

export type Backdrop = { kind: "camera"; stream: MediaStream } | { kind: "photo"; url: string };

type RoomStudioProps = {
  products: ArProduct[];
  backdrop: Backdrop;
  initialSlug?: string | null;
  onClose: () => void;
};

let counter = 0;
const newUid = () => `item-${Date.now().toString(36)}-${counter++}`;

/** Draw `source` into the canvas like CSS object-fit: cover. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / sw, height / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, (width - dw) / 2, (height - dh) / 2, dw, dh);
}

function IconButton({
  label,
  onClick,
  children,
  disabled,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-35",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Full-screen room planner. The background is the live camera or a photo;
 * pieces are placed on a virtual floor over it and can be dragged, turned,
 * resized and removed. The result can be saved or shared as a picture.
 */
export function RoomStudio({ products, backdrop, initialSlug, onClose }: RoomStudioProps) {
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const addToCart = useCart((s) => s.add);

  const first = products.find((p) => p.slug === initialSlug) ?? products[0];
  const [items, setItems] = useState<PlacedItem[]>(() =>
    first ? [{ uid: newUid(), product: first, x: 0, z: 0, rotation: -0.3, scale: 1 }] : [],
  );
  const [selected, setSelected] = useState<string | null>(items[0]?.uid ?? null);
  const [cameraHeight, setCameraHeight] = useState(1.6);
  const [snapping, setSnapping] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (backdrop.kind === "camera" && video.current) {
      video.current.srcObject = backdrop.stream;
      video.current.play().catch(() => {});
    }
  }, [backdrop]);

  // Close with Escape, and lock page scrolling while the studio is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const current = items.find((i) => i.uid === selected) ?? null;

  const update = useCallback((uid: string, change: Partial<PlacedItem>) => {
    setItems((list) => list.map((i) => (i.uid === uid ? { ...i, ...change } : i)));
  }, []);

  function add(product: ArProduct) {
    const uid = newUid();
    const offset = (items.length % 5) * 0.35 - 0.7;
    setItems((list) => [...list, { uid, product, x: offset, z: -0.4, rotation: 0, scale: 1 }]);
    setSelected(uid);
  }

  async function snapshot() {
    const root = stage.current;
    const gl = root?.querySelector("canvas");
    if (!root || !gl) return;
    setSnapping(true);
    // Hide the selection ring for the picture, and wait for the scene to redraw.
    const wasSelected = selected;
    setSelected(null);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      const { width, height } = root.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas");

      if (backdrop.kind === "camera" && video.current) {
        drawCover(ctx, video.current, video.current.videoWidth, video.current.videoHeight, canvas.width, canvas.height);
      } else if (photo.current) {
        drawCover(ctx, photo.current, photo.current.naturalWidth, photo.current.naturalHeight, canvas.width, canvas.height);
      }
      ctx.drawImage(gl, 0, 0, canvas.width, canvas.height);

      // Small brand mark in the corner.
      ctx.font = `${Math.round(14 * ratio)}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("Home Decor Furniture · AR room", 16 * ratio, canvas.height - 18 * ratio);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("no image");
      const file = new File([blob], "my-room.jpg", { type: "image/jpeg" });

      // Phones and tablets get the share sheet; computers save a file.
      const touch = window.matchMedia("(pointer: coarse)").matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My room with Home Decor Furniture" }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-room.jpg";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setToast("Picture saved to your downloads");
      }
    } catch {
      setToast("Could not take the picture. Please try again.");
    } finally {
      setSelected(wasSelected);
      setSnapping(false);
    }
  }

  const uniqueProducts = [...new Map(items.map((i) => [i.product.id, i.product])).values()];
  const total = items.reduce((sum, i) => sum + i.product.price, 0);

  return (
    <div className="fixed inset-0 z-[75] flex flex-col bg-black text-white" role="dialog" aria-label="AR room planner">
      <div ref={stage} className="relative flex-1 overflow-hidden">
        {backdrop.kind === "camera" ? (
          <video ref={video} playsInline muted autoPlay className="absolute inset-0 size-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL, read back for the screenshot
          <img ref={photo} src={backdrop.url} alt="Your room" className="absolute inset-0 size-full object-cover" />
        )}

        <RoomScene
          items={items}
          selected={selected}
          onSelect={setSelected}
          onMove={(uid, x, z) => update(uid, { x, z })}
          cameraHeight={cameraHeight}
        />

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4">
          <div>
            <p className="text-sm font-semibold">AR room</p>
            <p className="text-xs text-white/70">
              {items.length} {items.length === 1 ? "piece" : "pieces"} · {formatPrice(total)}
            </p>
          </div>
          <div className="flex gap-2">
            <IconButton label="Take a picture" onClick={snapshot} disabled={snapping}>
              {snapping ? <LoaderCircle className="size-5 animate-spin" /> : <Camera className="size-5" />}
            </IconButton>
            <IconButton label="Close the AR room" onClick={onClose}>
              <X className="size-5" />
            </IconButton>
          </div>
        </div>

        {/* View angle: match the virtual floor to the camera or photo. */}
        <label className="absolute top-1/2 right-3 flex -translate-y-1/2 flex-col items-center gap-2 rounded-full bg-black/40 px-2 py-4 text-[0.65rem] tracking-wide text-white/80 uppercase backdrop-blur-md">
          <span>High</span>
          <input
            type="range"
            min={0.6}
            max={3.4}
            step={0.05}
            value={cameraHeight}
            onChange={(e) => setCameraHeight(Number(e.target.value))}
            aria-label="Viewing height"
            className="h-32 w-1.5 accent-[#e3a56f] [writing-mode:vertical-lr] [direction:rtl]"
          />
          <span>Low</span>
        </label>

        {toast && (
          <p role="status" className="absolute top-20 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm backdrop-blur">
            {toast}
          </p>
        )}

        {items.length === 0 && (
          <p className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-full bg-black/60 px-5 py-3 text-sm backdrop-blur">
            Pick a piece below to place it in your room
          </p>
        )}

        {/* Controls for the selected piece */}
        {current && (
          <div className="absolute inset-x-0 bottom-3 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-center gap-2 rounded-full bg-black/50 p-2 backdrop-blur-md">
            <span className="hidden max-w-40 truncate px-3 text-sm sm:block">{current.product.name}</span>
            <IconButton label="Turn left" onClick={() => update(current.uid, { rotation: current.rotation + Math.PI / 12 })}>
              <RotateCcw className="size-4" />
            </IconButton>
            <IconButton label="Turn right" onClick={() => update(current.uid, { rotation: current.rotation - Math.PI / 12 })}>
              <RotateCw className="size-4" />
            </IconButton>
            <IconButton label="Smaller" onClick={() => update(current.uid, { scale: Math.max(0.4, current.scale - 0.1) })}>
              <Minus className="size-4" />
            </IconButton>
            <IconButton label="Bigger" onClick={() => update(current.uid, { scale: Math.min(2.5, current.scale + 0.1) })}>
              <Plus className="size-4" />
            </IconButton>
            <IconButton label="Duplicate" onClick={() => add(current.product)}>
              <Copy className="size-4" />
            </IconButton>
            <IconButton
              label="Remove"
              onClick={() => {
                setItems((list) => list.filter((i) => i.uid !== current.uid));
                setSelected(null);
              }}
              className="hover:bg-red-600/70"
            >
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        )}
      </div>

      {/* Product tray */}
      <div className="border-t border-white/10 bg-[#0a0908] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <ul className="no-scrollbar flex flex-1 gap-2 overflow-x-auto" aria-label="Add a piece">
            {products.map((p) => (
              <li key={p.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => add(p)}
                  className="flex items-center gap-2 rounded-2xl bg-white/[0.06] p-1.5 pr-3 text-left transition-colors hover:bg-white/[0.12]"
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-white/10">
                    {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                  </span>
                  <span>
                    <span className="block max-w-32 truncate text-xs font-medium">{p.name}</span>
                    <span className="block text-[0.7rem] text-white/60 tabular-nums">{formatPrice(p.price)}</span>
                  </span>
                  <Plus className="size-4 text-[#e3a56f]" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={uniqueProducts.length === 0}
            aria-label="Add every piece in the room to the cart"
            onClick={() => {
              const available = uniqueProducts.filter((p) => p.inStock);
              for (const p of available) {
                addToCart({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.image }, 1, false);
              }
              setToast(
                available.length
                  ? `Added ${available.length} ${available.length === 1 ? "piece" : "pieces"} to your cart`
                  : "These pieces are sold out right now",
              );
            }}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#e3a56f] px-4 text-sm font-semibold text-black disabled:opacity-40 sm:px-5"
          >
            <ShoppingBag className="size-4" aria-hidden />
            <span className="hidden sm:inline">Add room to cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
