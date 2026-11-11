import { cn } from "@/lib/utils";

/** Glowing ring shown while a 3D scene downloads. */
export function SceneLoader({ visible, label = "Loading 3D" }: { visible: boolean; label?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-700",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="size-14 animate-spin rounded-full border-2 border-line border-t-accent" />
        <span className="text-xs tracking-[0.25em] text-muted uppercase">{label}</span>
      </div>
    </div>
  );
}
