"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Camera, ImageUp, LoaderCircle, ScanLine, Smartphone } from "lucide-react";
import { FormMessage } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { ArProduct } from "./ar-types";
import type { Backdrop } from "./room-studio";
import { isWebXrArSupported } from "./webxr-session";

// The 3D engine is large; it downloads only when the visitor opens the room.
const RoomStudio = dynamic(() => import("./room-studio").then((m) => m.RoomStudio), { ssr: false });
const WebXrSession = dynamic(() => import("./webxr-session").then((m) => m.WebXrSession), { ssr: false });

type Mode = { kind: "idle" } | { kind: "studio"; backdrop: Backdrop } | { kind: "xr" };

function Option({
  icon: Icon,
  title,
  text,
  badge,
  onClick,
  busy,
  disabled,
  children,
}: {
  icon: typeof Camera;
  title: string;
  text: string;
  badge?: string;
  onClick?: () => void;
  busy?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <span className="flex items-start justify-between">
        <span className="glass grid size-12 place-items-center rounded-2xl text-accent">
          {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Icon className="size-5" aria-hidden />}
        </span>
        {badge && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">{badge}</span>}
      </span>
      <span className="mt-10 block text-2xl font-semibold tracking-tight">{title}</span>
      <span className="mt-2 block text-sm leading-relaxed text-muted">{text}</span>
    </>
  );
  const styles = cn(
    "ring-glow group relative flex flex-col rounded-panel border border-line bg-surface p-7 text-left transition-all duration-500 hover:-translate-y-1",
    disabled && "pointer-events-none opacity-50",
  );
  if (children) {
    return (
      <label className={cn(styles, "cursor-pointer")}>
        {body}
        {children}
      </label>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled || busy} className={styles}>
      {body}
    </button>
  );
}

/** Start screen of the live AR room: choose camera, photo or true AR. */
export function LiveRoom({ products }: { products: ArProduct[] }) {
  const initialSlug = useSearchParams().get("product");
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [xrSupported, setXrSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    isWebXrArSupported().then((ok) => alive && setXrSupported(ok));
    return () => {
      alive = false;
    };
  }, []);

  const close = useCallback(() => {
    setMode((m) => {
      if (m.kind === "studio") {
        if (m.backdrop.kind === "camera") m.backdrop.stream.getTracks().forEach((t) => t.stop());
        else URL.revokeObjectURL(m.backdrop.url);
      }
      return { kind: "idle" };
    });
  }, []);

  async function openCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot open the camera. Try uploading a photo of your room instead.");
      return;
    }
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setMode({ kind: "studio", backdrop: { kind: "camera", stream } });
    } catch (e) {
      const name = (e as DOMException).name;
      setError(
        name === "NotAllowedError"
          ? "Camera access was blocked. Allow the camera in your browser settings, or upload a photo instead."
          : "No camera was found. You can upload a photo of your room instead.",
      );
    } finally {
      setBusy(false);
    }
  }

  function openPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo.");
      return;
    }
    setError("");
    setMode({ kind: "studio", backdrop: { kind: "photo", url: URL.createObjectURL(file) } });
  }

  if (products.length === 0) {
    return <p className="rounded-panel bg-surface px-6 py-16 text-center text-muted">No 3D pieces are available yet.</p>;
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Option
          icon={Camera}
          title="Use your camera"
          text="See the room live through your phone or laptop camera, then add, move and turn pieces on screen."
          badge="Any device"
          onClick={openCamera}
          busy={busy}
        />
        <Option
          icon={ImageUp}
          title="Use a room photo"
          text="Upload a picture of your room and style it with as many pieces as you like."
        >
          <input type="file" accept="image/*" className="sr-only" onChange={openPhoto} />
        </Option>
        <Option
          icon={ScanLine}
          title="True AR"
          text={
            xrSupported
              ? "Your phone finds the real floor. Tap to place pieces at exact size and walk around them."
              : "Needs Chrome on an ARCore Android phone. On iPhone, open any 3D product and tap “View in your room”."
          }
          badge={xrSupported ? "Available" : undefined}
          onClick={() => setMode({ kind: "xr" })}
          disabled={!xrSupported}
        />
      </div>

      <div className="mt-4">
        <FormMessage>{error}</FormMessage>
      </div>

      <p className="mt-6 flex items-start gap-3 text-sm text-muted">
        <Smartphone className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        Camera images and photos stay on your device; nothing is uploaded.
      </p>

      {mode.kind === "studio" && (
        <RoomStudio products={products} backdrop={mode.backdrop} initialSlug={initialSlug} onClose={close} />
      )}
      {mode.kind === "xr" && <WebXrSession products={products} initialSlug={initialSlug} onClose={close} />}
    </>
  );
}
