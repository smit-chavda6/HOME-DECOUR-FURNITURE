"use client";

import { useActionState } from "react";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/validation";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {} as FormState);
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage>{state.message}</FormMessage>
      <Field label="Username" htmlFor="username" error={e.username}>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={state.values?.username ?? ""}
          error={e.username}
          required
          autoFocus
        />
      </Field>
      <Field label="Password" htmlFor="password" error={e.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" error={e.password} required />
      </Field>
      <SubmitButton className="w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
