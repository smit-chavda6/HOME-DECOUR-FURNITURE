"use client";

import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { sendMessageAction } from "@/lib/actions/contact";
import type { FormState } from "@/lib/validation";

const subjects = ["General question", "Order status", "Custom design", "Returns", "Something else"];

export function ContactForm() {
  const [state, action] = useActionState(sendMessageAction, {} as FormState);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="flex flex-col items-center rounded-panel bg-surface-2 px-6 py-16 text-center">
        <CircleCheck className="size-12 text-sage" aria-hidden />
        <h2 className="mt-5 font-display text-2xl">Message sent</h2>
        <p className="mt-2 max-w-sm text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {/* Hidden from people; bots fill it in and get ignored. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <FormMessage>{state.message}</FormMessage>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={e.name}>
          <Input id="name" name="name" autoComplete="name" defaultValue={v.name} error={e.name} required />
        </Field>
        <Field label="Email" htmlFor="email" error={e.email}>
          <Input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} required />
        </Field>
        <Field label="Phone" htmlFor="phone" error={e.phone} optional>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} error={e.phone} />
        </Field>
        <Field label="Subject" htmlFor="subject" error={e.subject}>
          <Select id="subject" name="subject" defaultValue={v.subject ?? subjects[0]} error={e.subject}>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Message" htmlFor="message" error={e.message}>
        <Textarea id="message" name="message" maxLength={4000} placeholder="Tell us what you need…" defaultValue={v.message} error={e.message} required />
      </Field>

      <SubmitButton size="lg" pendingText="Sending…">Send message</SubmitButton>
    </form>
  );
}
