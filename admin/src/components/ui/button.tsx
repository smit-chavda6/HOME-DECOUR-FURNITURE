import { cn } from "@/lib/utils";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0";

const variants = {
  /** Copper gradient with a soft glow: the main call to action. */
  primary:
    "bg-accent text-accent-ink shadow-[0_1px_2px_rgb(0_0_0/0.08),0_8px_20px_-10px_var(--glow)] hover:bg-[#a8380a] hover:shadow-[0_1px_2px_rgb(0_0_0/0.08),0_12px_28px_-10px_var(--glow)]",
  outline: "border border-line-strong bg-surface text-ink shadow-[var(--shadow-sm)] hover:border-ink/25 hover:bg-surface-2",
  ghost: "text-ink hover:bg-ink/[0.07]",
  /** Light pill for use on dark imagery or the inverse bands. */
  inverse: "bg-ink text-bg hover:bg-ink/85",
} as const;

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[0.95rem]",
  icon: "size-10",
} as const;

type ButtonStyle = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

/**
 * Class names for a button. Use directly on a <Link> when the "button" is
 * really navigation: <Link className={buttonStyles({ variant: "outline" })}>
 */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyle = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = React.ComponentProps<"button"> & ButtonStyle;

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
