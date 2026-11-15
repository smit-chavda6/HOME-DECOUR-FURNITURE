import Image from "next/image";
import Link from "next/link";
import { Camera, Layers, ScanLine, Share2 } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { buttonStyles } from "@/components/ui/button";
import { assetUrl } from "@/lib/utils";

const features = [
  { icon: ScanLine, title: "True-to-size", text: "Pieces appear at their real dimensions on your floor." },
  { icon: Layers, title: "Style a whole room", text: "Place a sofa, a table and a chair together and arrange them." },
  { icon: Camera, title: "Your camera or a photo", text: "Use the live camera, or upload a photo of your room." },
  { icon: Share2, title: "Snap and share", text: "Save the result and send it to family before you decide." },
];

function Corner({ className }: { className: string }) {
  return <span aria-hidden className={`absolute size-7 border-white/90 ${className}`} />;
}

export function ArFeature() {
  return (
    <section className="container-page mt-28 lg:mt-36">
      <div className="ring-glow relative overflow-hidden rounded-panel border border-line bg-surface">
        <div className="spotlight pointer-events-none absolute inset-0 [--x:85%] [--y:30%]" />
        <div className="relative grid items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-16 lg:py-20">
          <Reveal>
            <p className="eyebrow">Live AR room</p>
            <h2 className="mt-5 text-4xl leading-[0.95] font-semibold sm:text-5xl lg:text-6xl">
              Not sure it fits? <em className="text-gradient">See it there</em> first.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Open the AR room, point your camera at the floor and drop in as many pieces as you like.
              Move them, turn them, then snap a picture.
            </p>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="glass grid size-11 shrink-0 place-items-center rounded-2xl text-accent">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-0.5 text-sm text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/ar/live" className={buttonStyles({ size: "lg" })}>
                <ScanLine aria-hidden />
                Open the AR room
              </Link>
              <Link href="/ar" className={buttonStyles({ variant: "outline", size: "lg" })}>
                Browse 3D pieces
              </Link>
            </div>
          </Reveal>

          {/* Decorative phone showing the camera view with a scanning line. */}
          <Reveal delay={0.1} className="flex justify-center">
            <div aria-hidden className="relative animate-float">
              <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,var(--glow),transparent_65%)] blur-2xl" />
              <div className="relative w-64 rounded-[2.9rem] border border-white/15 bg-black p-2.5 shadow-2xl sm:w-72">
                <div className="relative aspect-[9/18] overflow-hidden rounded-[2.2rem]">
                  <Image
                    src={assetUrl("image/catalog/pebble-travertine-side-table.svg")!}
                    alt=""
                    fill
                    sizes="288px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-5 [--scan-distance:26rem]">
                    <Corner className="top-0 left-0 rounded-tl-xl border-t-2 border-l-2" />
                    <Corner className="top-0 right-0 rounded-tr-xl border-t-2 border-r-2" />
                    <Corner className="bottom-0 left-0 rounded-bl-xl border-b-2 border-l-2" />
                    <Corner className="right-0 bottom-0 rounded-br-xl border-r-2 border-b-2" />
                    <span className="absolute inset-x-0 top-0 h-0.5 animate-scan bg-[#e3a56f] shadow-[0_0_20px_6px_rgba(227,165,111,0.6)]" />
                  </div>
                  <div className="absolute inset-x-4 bottom-5 flex items-center justify-between rounded-full bg-black/55 px-4 py-2 text-xs text-white backdrop-blur">
                    <span>Floor found</span>
                    <span className="size-2 animate-pulse rounded-full bg-[#a8b596]" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
