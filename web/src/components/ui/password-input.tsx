"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Input } from "./field";

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  /** Show a strength bar under the field (for new passwords). */
  meter?: boolean;
};

const LEVELS = [
  { label: "Too short", color: "bg-red-500" },
  { label: "Weak", color: "bg-orange-500" },
  { label: "Fair", color: "bg-amber-400" },
  { label: "Good", color: "bg-lime-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

/** Rough strength score 0–4: length plus variety of character types. */
function score(pw: string) {
  if (pw.length < 8) return 0;
  let s = 1;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

/** Password field with a show/hide toggle and an optional strength meter. */
export function PasswordInput({ meter, className, onChange, ...props }: PasswordInputProps) {
  const [shown, setShown] = useState(false);
  const [value, setValue] = useState("");
  const level = score(value);

  return (
    <div>
      <div className="relative">
        <Input
          {...props}
          type={shown ? "text" : "password"}
          className={cn("pr-12", className)}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute inset-y-0 right-1 grid w-10 place-items-center rounded-lg text-muted transition-colors hover:text-ink"
        >
          {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {meter && value && (
        <div className="mt-2 flex items-center gap-3" aria-live="polite">
          <div className="grid flex-1 grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className="h-1 overflow-hidden rounded-full bg-line">
                <motion.span
                  className={cn("block h-full rounded-full", LEVELS[level].color)}
                  initial={false}
                  animate={{ scaleX: level >= n ? 1 : 0 }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            ))}
          </div>
          <span className="w-16 text-right text-xs text-muted">{LEVELS[level].label}</span>
        </div>
      )}
    </div>
  );
}
