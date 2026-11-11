import { Sparkle } from "lucide-react";

const items = [
  "Free delivery over ₹50,000",
  "Every piece in 3D",
  "Place it in your room with AR",
  "7-day returns",
  "Assembly by our team",
  "Crafted in Ahmedabad",
];

/** Endless strip of promises, scrolling sideways. */
export function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="relative mt-6 overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <ul className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]" aria-label="Why shop with us">
        {row.map((text, i) => (
          <li key={i} aria-hidden={i >= items.length} className="flex items-center gap-10 text-lg whitespace-nowrap text-muted sm:text-2xl">
            <span className={i % 2 ? "font-serif italic" : "font-medium"}>{text}</span>
            <Sparkle className="size-4 text-accent" aria-hidden />
          </li>
        ))}
      </ul>
    </div>
  );
}
