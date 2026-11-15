"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  Heading1,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  MousePointerClick,
  Phone,
  ScanLine,
  Share2,
  Store,
  X,
} from "lucide-react";
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

const ICONS = {
  store: Store,
  phone: Phone,
  share: Share2,
  headline: Heading1,
  buttons: MousePointerClick,
  megaphone: Megaphone,
  calendar: CalendarDays,
} as const;

export type BlockSection = {
  title?: string;
  description?: string;
  icon?: keyof typeof ICONS;
  fields: BlockField[];
};

type Values = Record<string, string | boolean>;

/* ----------------------------------------------------------- previews --- */

function HomePreview({ v }: { v: Values }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0c0a09] p-5 text-white ring-1 ring-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(30rem_18rem_at_0%_100%,rgb(227_165_111/0.2),transparent_70%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.035)_0_1px,transparent_1px_3rem)]" />
      <div className="relative grid grid-cols-[1.1fr_0.9fr] items-center gap-4">
        <div className="min-w-0">
          {v.eyebrow && (
            <p className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[0.55rem] text-white/80">
              <span className="size-1 rounded-full bg-[#e3a56f]" />
              {String(v.eyebrow)}
            </p>
          )}
          <p className="mt-2 font-display text-[1.35rem] leading-[0.95] font-semibold tracking-[-0.04em]">
            {String(v.line1 || "Line 1")}
            <br />
            {String(v.line2 || "Line 2")}
            <br />
            <span className="text-gradient font-serif font-normal italic">{String(v.line3 || "line 3")}</span>.
          </p>
          {v.sentence && <p className="mt-2 line-clamp-2 text-[0.6rem] leading-relaxed text-white/65">{String(v.sentence)}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(110deg,#e3a56f,#f3cf9e)] px-2.5 py-1 text-[0.55rem] font-medium text-[#1a110a]">
              {String(v.primaryLabel || "Button")}
              <ArrowRight className="size-2.5" />
            </span>
            {v.secondaryLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.55rem]">
                <ScanLine className="size-2.5" />
                {String(v.secondaryLabel)}
              </span>
            )}
          </div>
        </div>
        <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[linear-gradient(160deg,#d8cdbd,#b7aa97)]">
          <svg viewBox="0 0 80 100" className="size-full" aria-hidden>
            <rect x="8" y="10" width="26" height="50" fill="#f4efe6" stroke="#1b1816" strokeWidth="1.5" />
            <path d="M21 10v50M8 35h26" stroke="#1b1816" strokeWidth="1" />
            <polygon points="40,30 60,35 60,60 40,55" fill="#fff6e4" opacity="0.6" />
            <rect x="0" y="74" width="80" height="26" fill="#a47b55" />
            <rect x="30" y="62" width="44" height="14" rx="4" fill="#efe7da" />
            <rect x="32" y="56" width="13" height="10" rx="3" fill="#e2d8c9" />
            <rect x="46" y="56" width="13" height="10" rx="3" fill="#e2d8c9" />
            <rect x="60" y="56" width="13" height="10" rx="3" fill="#e2d8c9" />
            <rect x="35" y="58" width="8" height="6" rx="2" fill="#a95c37" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function BannerPreview({ v }: { v: Values }) {
  const on = Boolean(v.enabled) && String(v.text ?? "").trim();
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-line">
      {on ? (
        <div className="relative flex items-center justify-center gap-2 bg-[#e3a56f] px-8 py-2 text-center text-xs text-[#1a110a]">
          <span className="truncate">{String(v.text)}</span>
          {v.href && (
            <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold underline underline-offset-2">
              {String(v.linkLabel || "Learn more")}
              <ArrowRight className="size-3" />
            </span>
          )}
          <X className="absolute right-2 size-3 opacity-70" />
        </div>
      ) : (
        <div className="bg-surface-2 px-4 py-2 text-center text-xs text-muted">The bar is off: nothing shows above the header.</div>
      )}
      <div className="flex items-center justify-between bg-[#0c0a09] px-4 py-3">
        <span className="text-[0.65rem] font-semibold text-white">
          Home <span className="font-serif font-normal text-[#e3a56f] italic">Decor</span>
        </span>
        <span className="flex gap-3 text-[0.55rem] text-white/60">
          <span>Shop</span>
          <span>AR Studio</span>
          <span>About</span>
        </span>
      </div>
      <div className="h-16 bg-[linear-gradient(180deg,#0c0a09,#1a1410)]" />
      {(v.startsAt || v.endsAt) && (
        <p className="flex items-center gap-1.5 bg-surface px-4 py-2 text-[0.68rem] text-muted">
          <CalendarDays className="size-3" />
          Shows {v.startsAt ? `from ${String(v.startsAt)}` : ""} {v.endsAt ? `until ${String(v.endsAt)}` : "until switched off"}
        </p>
      )}
    </div>
  );
}

function SettingsPreview({ v }: { v: Values }) {
  const social = ["instagram", "facebook", "youtube", "pinterest"].filter((k) => v[k]);
  return (
    <div className="overflow-hidden rounded-2xl bg-[#0c0a09] p-5 text-white ring-1 ring-white/10">
      <p className="font-display text-lg font-semibold tracking-tight">
        {String(v.name || "Store name")}
      </p>
      {v.tagline && <p className="mt-1 text-[0.68rem] text-white/60">{String(v.tagline)}</p>}
      <ul className="mt-4 space-y-2 text-xs text-white/80">
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#e3a56f]" />
          {String(v.address || "Address")}
        </li>
        <li className="flex items-center gap-2">
          <Phone className="size-3.5 shrink-0 text-[#e3a56f]" />
          {String(v.phone || "Phone")}
        </li>
        <li className="flex items-center gap-2 break-all">
          <Mail className="size-3.5 shrink-0 text-[#e3a56f]" />
          {String(v.email || "Email")}
        </li>
      </ul>
      {(social.length > 0 || v.whatsapp) && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {[...social, ...(v.whatsapp ? ["whatsapp"] : [])].map((s) => (
            <span key={s} className="rounded-full border border-white/15 px-2 py-0.5 text-[0.6rem] capitalize">
              {s}
            </span>
          ))}
        </div>
      )}
      <p className="mt-5 border-t border-white/10 pt-3 text-[0.6rem] text-white/45">© 2026 {String(v.name || "Store name")}</p>
    </div>
  );
}

const PREVIEWS = { home: HomePreview, banner: BannerPreview, settings: SettingsPreview } as const;
const PREVIEW_TEXT = {
  home: "The top of the shop's home page.",
  banner: "The strip above the shop's header.",
  settings: "The shop's footer and contact details.",
};

/* -------------------------------------------------------------- form --- */

/**
 * Editor for one block of website content: sections of fields in cards,
 * a live preview of how the shop will look, and a floating Save bar.
 */
export function BlockForm({
  action,
  sections,
  values,
  preview,
  submitLabel = "Save changes",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  sections: BlockSection[];
  values: Values;
  preview?: keyof typeof PREVIEWS;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, {} as FormState);
  const e = state.errors ?? {};
  const text = (name: string) => state.values?.[name] ?? String(values[name] ?? "");
  const checked = (name: string) => (state.values ? state.values[name] === "on" : Boolean(values[name]));
  const [live, setLive] = useState<Values>(values);
  const Preview = preview ? PREVIEWS[preview] : null;

  return (
    <form
      action={formAction}
      noValidate
      onInput={(ev) => {
        const t = ev.target as HTMLInputElement;
        if (!t.name) return;
        setLive((p) => ({ ...p, [t.name]: t.type === "checkbox" ? t.checked : t.value }));
      }}
      className={cn("grid gap-6", Preview && "xl:grid-cols-[minmax(0,1fr)_24rem]")}
    >
      <div className="min-w-0 space-y-6">
        {sections.map((section, i) => {
          const Icon = section.icon ? ICONS[section.icon] : null;
          return (
            <section key={section.title ?? i} className="rounded-card bg-surface p-5 ring-1 ring-line sm:p-6">
              {section.title && (
                <div className="mb-5 flex items-start gap-3">
                  {Icon && (
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                      <Icon className="size-4" aria-hidden />
                    </span>
                  )}
                  <div>
                    <h2 className="font-display text-lg font-semibold tracking-tight">{section.title}</h2>
                    {section.description && <p className="mt-0.5 text-sm text-muted">{section.description}</p>}
                  </div>
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                {section.fields.map((f) =>
                  f.type === "checkbox" ? (
                    <label
                      key={f.name}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-[var(--field)] px-4 py-3.5 text-sm font-medium transition has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10 sm:col-span-2"
                    >
                      <input type="checkbox" name={f.name} defaultChecked={checked(f.name)} className="size-4 accent-[var(--accent)]" />
                      <span>
                        {f.label}
                        {f.hint && <span className="block text-xs font-normal text-muted">{f.hint}</span>}
                      </span>
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
                        <div className="relative">
                          {f.type === "url" && (
                            <Link2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
                          )}
                          <Input
                            id={f.name}
                            name={f.name}
                            type={f.type === "url" ? "text" : (f.type ?? "text")}
                            inputMode={f.type === "url" ? "url" : undefined}
                            defaultValue={text(f.name)}
                            error={e[f.name]}
                            maxLength={f.maxLength}
                            placeholder={f.placeholder}
                            className={cn(f.type === "url" && "pl-10")}
                          />
                        </div>
                      )}
                    </Field>
                  ),
                )}
              </div>
            </section>
          );
        })}

        <div className="glass sticky bottom-3 z-10 !bg-surface-solid/90 shadow-[var(--shadow-lift)] flex flex-wrap items-center gap-3 rounded-[1.5rem] p-2 pl-2">
          <SubmitButton size="lg" pendingText="Saving…">
            {submitLabel}
          </SubmitButton>
          <div className="min-w-0 flex-1">
            <FormMessage ok={state.ok}>{state.message}</FormMessage>
          </div>
        </div>
      </div>

      {Preview && preview && (
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <p className="eyebrow mb-3 flex items-center gap-2">
            <Eye className="size-3.5" aria-hidden />
            Live preview
          </p>
          <Preview v={live} />
          <p className="mt-3 text-xs text-muted">{PREVIEW_TEXT[preview]} Updates as you type; the shop changes only when you save.</p>
        </aside>
      )}
    </form>
  );
}
