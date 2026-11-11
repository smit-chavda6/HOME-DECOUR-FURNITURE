import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  /** Plain text, or JSX to include an italic <em> accent word. */
  title: React.ReactNode;
  eyebrow?: string;
  description?: string;
  crumbs?: Crumb[];
  align?: "left" | "center";
  children?: React.ReactNode;
};

/** The heading block at the top of every inner page, lit by a soft spotlight. */
export function PageHeader({
  title,
  eyebrow,
  description,
  crumbs,
  align = "left",
  children,
}: PageHeaderProps) {
  return (
    <header className="relative isolate overflow-hidden">
      <div className="spotlight pointer-events-none absolute inset-0 -z-10 [--x:75%] [--y:-10%]" />
      <div className={cn("container-page pt-14 pb-12 sm:pt-20 lg:pt-24", align === "center" && "text-center")}>
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className={cn("flex flex-wrap items-center gap-1.5 text-sm text-muted", align === "center" && "justify-center")}>
              <li>
                <Link href="/" className="hover:text-ink">Home</Link>
              </li>
              {crumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3.5 opacity-50" aria-hidden />
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-ink">{crumb.label}</Link>
                  ) : (
                    <span aria-current="page" className="text-ink">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1
          className={cn(
            "text-5xl leading-[0.95] font-semibold sm:text-6xl lg:text-7xl",
            eyebrow && "mt-5",
            align === "center" && "mx-auto max-w-4xl",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className={cn("mt-6 max-w-2xl text-lg leading-relaxed text-muted", align === "center" && "mx-auto")}>
            {description}
          </p>
        )}
        {children}
      </div>
    </header>
  );
}
