import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container-page flex flex-col items-center py-28 text-center lg:py-40">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-6xl">This page could not be found</h1>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
        The link may be mistyped, or the piece may no longer be in our collection.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={buttonStyles({ size: "lg" })}>
          Browse furniture
        </Link>
        <Link href="/" className={buttonStyles({ variant: "outline", size: "lg" })}>
          <ArrowLeft aria-hidden />
          Back to home
        </Link>
      </div>
    </section>
  );
}
