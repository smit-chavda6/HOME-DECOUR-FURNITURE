import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { delay } from "@/lib/motion";
import { AuthShowcase } from "./auth-showcase";
import { AuthTabs } from "./auth-tabs";

/** Someone already signed in has no use for the login page. */
async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/account");
  return null;
}

type AuthShellProps = {
  mode: "login" | "register";
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
};

/**
 * Split layout shared by the login and register pages: an animated room
 * scene on one side, and the form on the other with each part settling in.
 */
export function AuthShell({ mode, title, description, children }: AuthShellProps) {
  return (
    <div className="container-page grid gap-10 py-8 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-10">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>

      <div className="hidden lg:block">
        <AuthShowcase />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col justify-center py-4">
        <div className="enter-rise" style={delay(100)}>
          {/* Tabs read ?next= from the URL, which is only known per request. */}
          <Suspense fallback={<div className="h-12 rounded-full bg-surface-2" />}>
            <AuthTabs mode={mode} />
          </Suspense>
        </div>

        <h1 className="enter-mask mt-10 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl" style={delay(220)}>
          {title}
        </h1>
        <p className="enter-rise mt-3 text-lg text-muted" style={delay(340)}>
          {description}
        </p>

        <div className="enter-rise mt-9" style={delay(460)}>
          {/* The forms read ?next= from the URL, which is only known per request. */}
          <Suspense fallback={<div className="h-80 animate-pulse rounded-card bg-surface-2" />}>
            {children}
          </Suspense>
        </div>

        <p className="enter-rise mt-10 flex items-center justify-center gap-2 text-xs text-muted" style={delay(600)}>
          <Lock className="size-3.5" aria-hidden />
          Passwords are hashed and never stored in plain text.
        </p>
      </div>
    </div>
  );
}
