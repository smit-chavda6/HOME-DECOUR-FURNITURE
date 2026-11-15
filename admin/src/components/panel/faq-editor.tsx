"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveFaqAction } from "@/lib/actions/content";
import type { Faq } from "@/lib/content-types";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/validation";

type Group = Faq["groups"][number];

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-30",
        danger && "hover:bg-red-600/10 hover:text-red-700 dark:hover:text-red-400",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Edit FAQ groups and their questions in the browser, then save everything
 * at once. The whole list travels as JSON in a hidden field.
 */
export function FaqEditor({ initial }: { initial: Faq }) {
  const [groups, setGroups] = useState<Group[]>(initial.groups);
  const [state, action] = useActionState(saveFaqAction, {} as FormState);
  const e = state.errors ?? {};

  const updateGroup = (gi: number, patch: Partial<Group>) =>
    setGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const updateItem = (gi: number, ii: number, patch: Partial<Group["items"][number]>) =>
    updateGroup(gi, { items: groups[gi].items.map((it, i) => (i === ii ? { ...it, ...patch } : it)) });

  return (
    <form action={action} className="max-w-4xl space-y-6" noValidate>
      <input type="hidden" name="faq" value={JSON.stringify({ groups })} />

      {groups.length === 0 && (
        <p className="rounded-card bg-surface-2 px-6 py-10 text-center text-sm text-muted">
          No questions yet. The shop shows its built-in FAQ until you save some.
        </p>
      )}

      {groups.map((group, gi) => (
        <section key={gi} className="rounded-card bg-surface p-5 ring-1 ring-line sm:p-6">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`g-${gi}`} className="eyebrow">
                Group {gi + 1}
              </label>
              <Input
                id={`g-${gi}`}
                value={group.title}
                onChange={(ev) => updateGroup(gi, { title: ev.target.value })}
                placeholder="Orders and delivery"
                error={e[`groups.${gi}.title`]}
                className="mt-1 font-medium"
              />
              {e[`groups.${gi}.title`] && <p className="mt-1 text-sm text-red-700 dark:text-red-400">{e[`groups.${gi}.title`]}</p>}
            </div>
            <div className="mt-6 flex">
              <IconButton label="Move group up" onClick={() => setGroups((gs) => move(gs, gi, gi - 1))} disabled={gi === 0}>
                <ArrowUp className="size-4" aria-hidden />
              </IconButton>
              <IconButton label="Move group down" onClick={() => setGroups((gs) => move(gs, gi, gi + 1))} disabled={gi === groups.length - 1}>
                <ArrowDown className="size-4" aria-hidden />
              </IconButton>
              <IconButton label="Remove group" danger onClick={() => setGroups((gs) => gs.filter((_, i) => i !== gi))}>
                <Trash2 className="size-4" aria-hidden />
              </IconButton>
            </div>
          </div>

          <ol className="mt-4 space-y-3">
            {group.items.map((item, ii) => {
              const qErr = e[`groups.${gi}.items.${ii}.q`];
              const aErr = e[`groups.${gi}.items.${ii}.a`];
              return (
                <li key={ii} className="flex gap-2 rounded-2xl border border-line bg-[var(--field)] p-3 transition focus-within:border-accent/40">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      aria-label={`Question ${ii + 1}`}
                      value={item.q}
                      onChange={(ev) => updateItem(gi, ii, { q: ev.target.value })}
                      placeholder="Question"
                      error={qErr}
                    />
                    <Textarea
                      aria-label={`Answer ${ii + 1}`}
                      value={item.a}
                      onChange={(ev) => updateItem(gi, ii, { a: ev.target.value })}
                      placeholder="Answer"
                      error={aErr}
                      className="min-h-20"
                    />
                    {(qErr || aErr) && <p className="text-sm text-red-700 dark:text-red-400">{qErr || aErr}</p>}
                  </div>
                  <div className="flex flex-col">
                    <IconButton
                      label="Move question up"
                      onClick={() => updateGroup(gi, { items: move(group.items, ii, ii - 1) })}
                      disabled={ii === 0}
                    >
                      <ArrowUp className="size-4" aria-hidden />
                    </IconButton>
                    <IconButton
                      label="Move question down"
                      onClick={() => updateGroup(gi, { items: move(group.items, ii, ii + 1) })}
                      disabled={ii === group.items.length - 1}
                    >
                      <ArrowDown className="size-4" aria-hidden />
                    </IconButton>
                    <IconButton
                      label="Remove question"
                      danger
                      onClick={() => updateGroup(gi, { items: group.items.filter((_, i) => i !== ii) })}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  </div>
                </li>
              );
            })}
          </ol>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => updateGroup(gi, { items: [...group.items, { q: "", a: "" }] })}
          >
            <Plus aria-hidden />
            Add question
          </Button>
        </section>
      ))}

      <Button variant="outline" onClick={() => setGroups((gs) => [...gs, { title: "", items: [{ q: "", a: "" }] }])}>
        <Plus aria-hidden />
        Add group
      </Button>

      <div className="glass sticky bottom-3 z-10 !bg-surface-solid/90 shadow-[var(--shadow-lift)] flex flex-wrap items-center gap-3 rounded-[1.5rem] p-2">
        <SubmitButton size="lg" pendingText="Saving…">Save FAQ</SubmitButton>
        <div className="min-w-0 flex-1">
          <FormMessage ok={state.ok}>{state.message}</FormMessage>
        </div>
      </div>
    </form>
  );
}
