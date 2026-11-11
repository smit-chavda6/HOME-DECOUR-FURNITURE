import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { assetUrl } from "@/lib/utils";

/** Someone already signed in has no use for the login page. */
async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/account");
  return null;
}

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

/** Two-column layout shared by the login and register pages. */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="container-page grid gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-20">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>

      <div className="mx-auto w-full max-w-md lg:py-8">
        <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg text-muted">{description}</p>
        <div className="mt-10">
          {/* The forms read ?next= from the URL, which is only known per request. */}
          <Suspense fallback={<div className="h-80 animate-pulse rounded-card bg-surface-2" />}>
            {children}
          </Suspense>
        </div>
      </div>

      <div className="relative hidden overflow-hidden rounded-panel bg-surface-2 lg:block">
        <Image
          src={assetUrl("image/product/HeritageTan™ Leather 3-Seater Sofa.webp")!}
          alt=""
          fill
          sizes="45vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <p className="absolute inset-x-8 bottom-8 font-display text-3xl leading-snug text-white">
          Your orders, saved pieces and reviews, all in one place.
        </p>
      </div>
    </div>
  );
}
