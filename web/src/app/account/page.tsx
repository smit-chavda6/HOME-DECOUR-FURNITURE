import { Suspense } from "react";
import { PasswordForm, ProfileForm } from "@/components/account/account-forms";
import { requireUser } from "@/lib/auth";

async function ProfileContent() {
  const user = await requireUser("/account");

  return (
    <div className="space-y-14">
      <section>
        <h2 className="font-display text-2xl font-medium">Your details</h2>
        <p className="mt-1 text-sm text-muted">
          {user.email} · @{user.username}. Your address is filled in for you at checkout.
        </p>
        <div className="mt-8 max-w-2xl">
          <ProfileForm user={user} />
        </div>
      </section>

      <section className="border-t border-line pt-12">
        <h2 className="font-display text-2xl font-medium">Password</h2>
        <div className="mt-8 max-w-2xl">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">Profile</h1>
      <div className="mt-10">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-surface-2" />}>
          <ProfileContent />
        </Suspense>
      </div>
    </>
  );
}
