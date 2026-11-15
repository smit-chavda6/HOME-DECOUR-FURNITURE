import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock, History, ShieldCheck } from "lucide-react";
import { BrandMark, BrandName } from "@/components/panel/brand";
import { RoomDrawing } from "@/components/panel/room-drawing";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/");

  return (
    <main className="grid min-h-svh bg-bg lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* left: brand and the drawn room on a warm off-white panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-[#fbfaf7] p-10 lg:flex xl:p-14">
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
          <defs>
            <pattern id="login-dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.1" fill="#111" fillOpacity="0.06" />
            </pattern>
            <radialGradient id="login-glow" cx="0.15" cy="0.85" r="0.7">
              <stop offset="0" stopColor="#ea580c" stopOpacity="0.1" />
              <stop offset="1" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dots)" />
          <rect width="100%" height="100%" fill="url(#login-glow)" />
        </svg>

        <div className="relative flex items-center gap-3">
          <BrandMark className="size-9 text-ink" />
          <BrandName />
        </div>

        <div className="relative">
          <RoomDrawing tone="light" className="float-slow w-full max-w-[40rem]" />
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-[1.9rem] leading-tight font-semibold tracking-[-0.03em]">
            Every room in the shop, <span className="font-serif font-normal text-accent italic">in one place.</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Products, orders, customers and every word on the website. Changes go live the moment you save.
          </p>
        </div>
      </section>

      {/* right: sign-in card */}
      <section className="grid place-items-center px-4 py-12">
        <div className="rise w-full max-w-sm">
          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark className="size-9 text-ink" />
            <BrandName />
          </div>

          <div className="mt-8 rounded-[1.25rem] border border-line bg-surface p-6 shadow-[var(--shadow-lift)] sm:p-8 lg:mt-0">
            <p className="eyebrow">Staff only</p>
            <h1 className="mt-2 font-display text-[1.9rem] font-semibold tracking-[-0.03em]">
              Welcome <span className="font-serif font-normal text-accent italic">back</span>
            </h1>
            <p className="mt-1 text-sm text-muted">Sign in with your admin username.</p>
            <div className="mt-7">
              <LoginForm />
            </div>
          </div>

          <ul className="mt-6 space-y-2 text-xs text-muted">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden />
              Separate admin accounts, never shop customers
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 shrink-0 text-accent" aria-hidden />
              Sessions end after 8 hours
            </li>
            <li className="flex items-center gap-2">
              <History className="size-4 shrink-0 text-accent" aria-hidden />
              Every sign-in and change is logged
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
