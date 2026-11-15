"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
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
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center rounded-panel bg-surface-2 px-6 py-16 text-center"
      >
        {/* A ring and tick that draw themselves. */}
        <svg viewBox="0 0 52 52" className="size-16 text-accent" aria-hidden>
          <motion.circle
            cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
          />
          <motion.path
            d="M15 27l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <h2 className="mt-6 text-2xl font-semibold">Message sent</h2>
        <p role="status" className="mt-2 max-w-sm text-muted">{state.message}</p>
      </motion.div>
    );
  }

  return (
    <form action={action} className="stagger space-y-5" noValidate>
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

      <SubmitButton size="lg" className="sheen" pendingText="Sending…">Send message</SubmitButton>
    </form>
  );
}
