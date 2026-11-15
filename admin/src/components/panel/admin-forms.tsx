"use client";

import { useActionState, useRef } from "react";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { setAdminActiveAction, createAdminAction } from "@/lib/actions/admins";
import { changePasswordAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/validation";
import { ToggleSwitch } from "./controls";

export function NewAdminForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await createAdminAction(prev, fd);
    if (result.ok) ref.current?.reset();
    return result;
  }, {} as FormState);
  const e = state.errors ?? {};
  const v = (k: string) => state.values?.[k] ?? "";

  return (
    <form ref={ref} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Name" htmlFor="new-name" error={e.name}>
        <Input id="new-name" name="name" defaultValue={v("name")} error={e.name} autoComplete="off" />
      </Field>
      <Field label="Username" htmlFor="new-username" error={e.username}>
        <Input id="new-username" name="username" defaultValue={v("username")} error={e.username} autoComplete="off" autoCapitalize="none" />
      </Field>
      <Field label="Email" htmlFor="new-email" error={e.email}>
        <Input id="new-email" name="email" type="email" defaultValue={v("email")} error={e.email} autoComplete="off" />
      </Field>
      <Field label="Password" htmlFor="new-password" error={e.password} hint="At least 12 characters.">
        <PasswordInput id="new-password" name="password" error={e.password} autoComplete="new-password" />
      </Field>
      <div className="space-y-3 sm:col-span-2">
        <FormMessage ok={state.ok}>{state.message}</FormMessage>
        <SubmitButton pendingText="Creating…">Create admin</SubmitButton>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await changePasswordAction(prev, fd);
    if (result.ok) ref.current?.reset();
    return result;
  }, {} as FormState);
  const e = state.errors ?? {};

  return (
    <form ref={ref} action={action} className="space-y-4" noValidate>
      <Field label="Current password" htmlFor="currentPassword" error={e.currentPassword}>
        <PasswordInput id="currentPassword" name="currentPassword" error={e.currentPassword} autoComplete="current-password" />
      </Field>
      <Field label="New password" htmlFor="newPassword" error={e.newPassword} hint="At least 12 characters.">
        <PasswordInput id="newPassword" name="newPassword" error={e.newPassword} autoComplete="new-password" />
      </Field>
      <Field label="Repeat new password" htmlFor="confirmPassword" error={e.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" error={e.confirmPassword} autoComplete="new-password" />
      </Field>
      <FormMessage ok={state.ok}>{state.message}</FormMessage>
      <SubmitButton variant="outline" pendingText="Saving…">
        Change password
      </SubmitButton>
    </form>
  );
}

export function AdminActiveToggle({ id, active, name }: { id: string; active: boolean; name: string }) {
  return <ToggleSwitch checked={active} label={`${name} can sign in`} action={(next) => setAdminActiveAction(id, next)} />;
}
