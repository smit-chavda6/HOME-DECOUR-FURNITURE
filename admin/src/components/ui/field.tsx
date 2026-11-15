import { cn } from "@/lib/utils";

/** Shared look for text inputs, selects and textareas. */
export const controlStyles =
  "w-full rounded-xl border border-line bg-[var(--field)] px-4 text-sm text-ink shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] placeholder:text-muted/60 transition-all duration-200 hover:border-accent/30 focus:border-accent/70 focus:bg-[var(--field-focus)] focus:shadow-[0_0_0_4px_var(--glow)] focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-red-600 dark:aria-[invalid=true]:border-red-400";

type FieldProps = {
  label: string;
  /** Must match the id of the control inside. */
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Label + control + hint or error, wired together for screen readers. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-[0.8rem] font-semibold tracking-wide text-ink/85">
        {label}
        {optional && <span className="text-xs font-normal text-muted">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.ComponentProps<"input"> & { error?: string };

export function Input({ className, error, id, ...props }: InputProps) {
  return (
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && id ? `${id}-error` : undefined}
      className={cn(controlStyles, "h-11", className)}
      {...props}
    />
  );
}

type TextareaProps = React.ComponentProps<"textarea"> & { error?: string };

export function Textarea({ className, error, id, ...props }: TextareaProps) {
  return (
    <textarea
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && id ? `${id}-error` : undefined}
      className={cn(controlStyles, "min-h-32 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

type SelectProps = React.ComponentProps<"select"> & { error?: string };

export function Select({ className, error, id, children, ...props }: SelectProps) {
  return (
    <select
      id={id}
      aria-invalid={error ? true : undefined}
      className={cn(controlStyles, "h-11 appearance-none bg-[length:1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

/** Green or red banner shown above or below a form after it is submitted. */
export function FormMessage({ ok, children }: { ok?: boolean; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        ok
          ? "border-emerald-700/25 bg-emerald-700/10 text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200"
          : "border-red-700/25 bg-red-700/10 text-red-900 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-200",
      )}
    >
      {children}
    </p>
  );
}
