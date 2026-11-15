"use client";

import { useActionState } from "react";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/validation";

export type BlockField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "email" | "url" | "date" | "checkbox";
  hint?: string;
  placeholder?: string;
  optional?: boolean;
  /** Take the full width of the two-column grid. */
  wide?: boolean;
  maxLength?: number;
};

export type BlockSection = { title?: string; description?: string; fields: BlockField[] };

/**
 * A simple editor for one block of website content: sections of fields, a
 * Save button, and the server's answer above it. Used by Store settings,
 * Home page and Announcement.
 */
export function BlockForm({
  action,
  sections,
  values,
  submitLabel = "Save changes",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  sections: BlockSection[];
  values: Record<string, string | boolean>;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, {} as FormState);
  const e = state.errors ?? {};
  const text = (name: string) => state.values?.[name] ?? String(values[name] ?? "");
  const checked = (name: string) => (state.values ? state.values[name] === "on" : Boolean(values[name]));

  return (
    <form action={formAction} className="max-w-3xl space-y-10" noValidate>
      {sections.map((section, i) => (
        <section key={section.title ?? i} className={cn(i > 0 && "border-t border-line pt-10")}>
          {section.title && <h2 className="font-display text-xl font-semibold">{section.title}</h2>}
          {section.description && <p className="mt-1 text-sm text-muted">{section.description}</p>}
          <div className={cn("grid gap-5 sm:grid-cols-2", section.title && "mt-5")}>
            {section.fields.map((f) =>
              f.type === "checkbox" ? (
                <label
                  key={f.name}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium sm:col-span-2"
                >
                  <input type="checkbox" name={f.name} defaultChecked={checked(f.name)} className="size-4 accent-[var(--accent)]" />
                  {f.label}
                  {f.hint && <span className="font-normal text-muted">— {f.hint}</span>}
                </label>
              ) : (
                <Field
                  key={f.name}
                  label={f.label}
                  htmlFor={f.name}
                  error={e[f.name]}
                  hint={f.hint}
                  optional={f.optional}
                  className={cn((f.wide || f.type === "textarea") && "sm:col-span-2")}
                >
                  {f.type === "textarea" ? (
                    <Textarea
                      id={f.name}
                      name={f.name}
                      defaultValue={text(f.name)}
                      error={e[f.name]}
                      maxLength={f.maxLength}
                      placeholder={f.placeholder}
                      className="min-h-24"
                    />
                  ) : (
                    <Input
                      id={f.name}
                      name={f.name}
                      type={f.type === "url" ? "text" : f.type ?? "text"}
                      inputMode={f.type === "url" ? "url" : undefined}
                      defaultValue={text(f.name)}
                      error={e[f.name]}
                      maxLength={f.maxLength}
                      placeholder={f.placeholder}
                    />
                  )}
                </Field>
              ),
            )}
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 -mx-4 space-y-3 border-t border-line bg-bg/90 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <FormMessage ok={state.ok}>{state.message}</FormMessage>
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
