"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction, registerAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/validation";

const initial: FormState = {};

/** Where to go after signing in, taken from ?next= in the URL. */
function useNext() {
  return useSearchParams().get("next") ?? "";
}

export function LoginForm() {
  const next = useNext();
  const [state, action] = useActionState(loginAction, initial);

  return (
    <form action={action} className="stagger space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage>{state.message}</FormMessage>

      <Field label="Username or email" htmlFor="identifier" error={state.errors?.identifier}>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          defaultValue={state.values?.identifier}
          error={state.errors?.identifier}
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" error={state.errors?.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          error={state.errors?.password}
          required
        />
      </Field>

      <SubmitButton size="lg" className="sheen w-full" pendingText="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const next = useNext();
  const [state, action] = useActionState(registerAction, initial);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  return (
    <form action={action} className="stagger space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage>{state.message}</FormMessage>

      <Field label="Full name" htmlFor="fullName" error={e.fullName}>
        <Input id="fullName" name="fullName" autoComplete="name" defaultValue={v.fullName} error={e.fullName} required />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Username" htmlFor="username" error={e.username}>
          <Input id="username" name="username" autoComplete="username" defaultValue={v.username} error={e.username} required />
        </Field>
        <Field label="Phone" htmlFor="phone" error={e.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" defaultValue={v.phone} error={e.phone} required />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} required />
      </Field>

      <Field label="Password" htmlFor="password" error={e.password} hint="At least 8 characters.">
        <PasswordInput id="password" name="password" autoComplete="new-password" error={e.password} required meter />
      </Field>

      <SubmitButton size="lg" className="sheen w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
