"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/field";
import { ORDER_STATUSES, orderStatusLabel } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/validation";

/**
 * Button that needs two clicks: the first arms it ("Confirm?"), the second
 * runs the action. Avoids browser confirm() pop-ups.
 */
export function ConfirmButton({
  action,
  label,
  confirmLabel = "Click again to confirm",
  className,
}: {
  action: () => Promise<FormState>;
  label: string;
  confirmLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onBlur={() => setArmed(false)}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          start(async () => {
            const result = await action();
            setArmed(false);
            if (result.ok) router.refresh();
            else setError(result.message ?? "Something went wrong.");
          });
        }}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
          armed
            ? "bg-red-700 text-white"
            : "text-red-700 hover:bg-red-700/10 dark:text-red-400",
          className,
        )}
      >
        {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <Trash2 className="size-3.5" aria-hidden />}
        {armed ? confirmLabel : label}
      </button>
      {error && <span className="text-xs text-red-700 dark:text-red-400">{error}</span>}
    </span>
  );
}

/** Dropdown that saves as soon as a new value is picked. */
export function AutoSaveSelect({
  value,
  options,
  action,
  label,
}: {
  value: string;
  options: { value: string; label: string }[];
  action: (next: string) => Promise<FormState>;
  label: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <span className="inline-flex flex-col gap-1">
      <Select
        aria-label={label}
        value={current}
        disabled={pending}
        className="h-9 w-40 text-xs"
        onChange={(event) => {
          const next = event.target.value;
          const previous = current;
          setCurrent(next);
          setError("");
          start(async () => {
            const result = await action(next);
            if (result.ok) router.refresh();
            else {
              setCurrent(previous);
              setError(result.message ?? "Could not save.");
            }
          });
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {error && <span className="text-xs text-red-700 dark:text-red-400">{error}</span>}
    </span>
  );
}

export const orderStatusOptions = ORDER_STATUSES.map((s) => ({
  value: s,
  label: orderStatusLabel[s],
}));

/** On/off switch that saves immediately. */
export function ToggleSwitch({
  checked,
  action,
  label,
}: {
  checked: boolean;
  action: (next: boolean) => Promise<FormState>;
  label: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(checked);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        start(async () => {
          const result = await action(next);
          if (result.ok) router.refresh();
          else setOn(!next);
        });
      }}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
        on ? "bg-sage" : "bg-line",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
          on && "translate-x-5",
        )}
      />
    </button>
  );
}
