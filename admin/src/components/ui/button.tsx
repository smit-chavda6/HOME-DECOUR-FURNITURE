import { cn } from "@/lib/utils";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0";

const variants = {
  /** Copper gradient with a soft glow: the main call to action. */
  primary:
    "bg-[linear-gradient(110deg,var(--accent),var(--accent-2)_50%,var(--accent))] bg-[length:200%_100%] bg-left text-accent-ink shadow-[0_10px_40px_-12px_var(--glow)] hover:bg-right hover:shadow-[0_14px_50px_-10px_var(--glow)]",
  outline: "glass text-ink hover:border-ink/30 hover:bg-ink/[0.07]",
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
