import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/");

  return (
    <main className="grid min-h-svh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="size-10" />
          <div>
            <p className="font-display text-lg font-semibold leading-tight">Home Decor</p>
            <p className="eyebrow">Admin panel</p>
          </div>
        </div>

        <div className="mt-8 rounded-card bg-surface p-6 ring-1 ring-line sm:p-8">
          <h1 className="font-display text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted">For shop staff only.</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          Sessions end after 8 hours. Every sign-in is logged.
        </p>
      </div>
    </main>
  );
}
