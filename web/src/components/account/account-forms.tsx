"use client";

import { useActionState } from "react";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { changePasswordAction, updateProfileAction } from "@/lib/actions/account";
import type { CurrentUser } from "@/lib/auth";
import type { FormState } from "@/lib/validation";

const initial: FormState = {};

export function ProfileForm({ user }: { user: CurrentUser }) {
  const [state, action] = useActionState(updateProfileAction, initial);
  const e = state.errors ?? {};
  // After a submit show what was typed; before that, what is saved.
  const v = (key: keyof CurrentUser) => state.values?.[key] ?? String(user[key] ?? "");

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={e.fullName}>
          <Input id="fullName" name="fullName" autoComplete="name" defaultValue={v("fullName")} error={e.fullName} required />
        </Field>
        <Field label="Phone" htmlFor="phone" error={e.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={v("phone")} error={e.phone} required />
        </Field>
      </div>

      <Field label="Address line 1" htmlFor="addressLine1" error={e.addressLine1} optional>
        <Input id="addressLine1" name="addressLine1" autoComplete="address-line1" defaultValue={v("addressLine1")} error={e.addressLine1} />
      </Field>
      <Field label="Address line 2" htmlFor="addressLine2" error={e.addressLine2} optional>
        <Input id="addressLine2" name="addressLine2" autoComplete="address-line2" defaultValue={v("addressLine2")} error={e.addressLine2} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="City" htmlFor="city" error={e.city} optional>
          <Input id="city" name="city" autoComplete="address-level2" defaultValue={v("city")} error={e.city} />
        </Field>
        <Field label="State" htmlFor="state" error={e.state} optional>
          <Input id="state" name="state" autoComplete="address-level1" defaultValue={v("state")} error={e.state} />
        </Field>
        <Field label="PIN code" htmlFor="postalCode" error={e.postalCode} optional>
          <Input id="postalCode" name="postalCode" inputMode="numeric" autoComplete="postal-code" defaultValue={v("postalCode")} error={e.postalCode} />
        </Field>
      </div>

      <FormMessage ok={state.ok}>{state.message}</FormMessage>
      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initial);
  const e = state.errors ?? {};

  return (
    // The key resets the fields after a successful change.
    <form action={action} key={state.ok ? "done" : "form"} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Current password" htmlFor="currentPassword" error={e.currentPassword}>
          <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" error={e.currentPassword} required />
        </Field>
        <Field label="New password" htmlFor="newPassword" error={e.newPassword} hint="At least 8 characters.">
          <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" error={e.newPassword} required />
        </Field>
      </div>

      <FormMessage ok={state.ok}>{state.message}</FormMessage>
      <SubmitButton variant="outline" pendingText="Updating…">Change password</SubmitButton>
    </form>
  );
}
