import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type SectionHeadingProps = {
  eyebrow: string;
  /** Plain text, or JSX with an <em> accent word. */
  title: React.ReactNode;
  action?: { label: string; href: string };
};

/** Eyebrow + large title on the left, optional link on the right. */
export function SectionHeading({ eyebrow, title, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div className="max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-4 text-4xl leading-[0.95] font-semibold sm:text-5xl lg:text-6xl">{title}</h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className="group glass inline-flex items-center gap-2 rounded-full py-2 pr-2 pl-5 text-sm font-medium transition-colors hover:border-accent/50"
        >
          {action.label}
          <span className="grid size-8 place-items-center rounded-full bg-ink text-bg transition-transform group-hover:rotate-45">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </Link>
      )}
    </div>
  );
}
