import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ExternalLink, FileText, PencilLine, Plus } from "lucide-react";
import { ConfirmButton } from "@/components/panel/controls";
import { EmptyState, PageHero, StatStrip } from "@/components/panel/ui";
import { buttonStyles } from "@/components/ui/button";
import { deletePostAction } from "@/lib/actions/content";
import { requireAdmin } from "@/lib/auth";
import { getPostRows } from "@/lib/data/content";
import { assetUrl, cn, daysAgo, formatDate, shopUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogListPage() {
  await requireAdmin();
  const posts = await getPostRows();
  const published = posts.filter((p) => p.status === "published").length;
  const scheduled = posts.filter((p) => p.status === "published" && new Date(p.publishedAt).getTime() > daysAgo(0)).length;

  return (
    <div className="rise">
      <PageHero
        icon={FileText}
        eyebrow="Website · journal"
        title="Stories for"
        accent="the journal"
        description="Articles in the shop's Journal. Drafts stay private; published articles with a future date go live on that day."
      >
        <Link href="/content/blog/new" className={buttonStyles({ size: "lg" })}>
          <Plus aria-hidden />
          New article
        </Link>
      </PageHero>

      <StatStrip
        items={[
          { label: "Articles", value: posts.length, tone: "accent" },
          { label: "Published", value: published, tone: "good" },
          { label: "Drafts", value: posts.length - published },
          { label: "Scheduled", value: scheduled, tone: scheduled ? "warn" : "default" },
        ]}
      />

      {posts.length === 0 ? (
        <EmptyState title="No articles yet" text="The shop shows its built-in articles until you write one.">
          <Link href="/content/blog/new" className={buttonStyles()}>
            <Plus aria-hidden />
            Write the first one
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {posts.map((p) => {
            const cover = assetUrl(p.image);
            return (
              <li
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-card bg-surface ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] hover:ring-accent/40"
              >
                <Link href={`/content/blog/${p.id}`} className="relative block aspect-[16/9] overflow-hidden bg-surface-2">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <span className="grid size-full place-items-center text-muted">
                      <FileText className="size-8" aria-hidden />
                    </span>
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span
                    className={cn(
                      "absolute top-3 left-3 rounded-full px-2.5 py-1 font-mono text-[0.62rem] font-bold tracking-wider uppercase backdrop-blur",
                      p.status === "published" ? "bg-emerald-500/85 text-white" : "bg-white/80 text-stone-800",
                    )}
                  >
                    {p.status === "published" ? "Published" : "Draft"}
                  </span>
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[0.7rem] text-white/90">
                    <Clock className="size-3" aria-hidden />
                    {Math.max(1, Math.round(p.words / 200))} min read
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <p className="eyebrow">{formatDate(p.publishedAt)}</p>
                  <Link href={`/content/blog/${p.id}`} className="mt-1.5 font-display text-xl leading-snug font-semibold tracking-tight hover:text-accent">
                    {p.title}
                  </Link>
                  {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted">{p.excerpt}</p>}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
                    <span className="truncate font-mono text-[0.68rem] text-muted">/blog/{p.slug}</span>
                    <span className="flex items-center gap-1">
                      {p.status === "published" && (
                        <a
                          href={shopUrl(`/blog/${p.slug}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${p.title} in the shop`}
                          className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
                        >
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      )}
                      <Link
                        href={`/content/blog/${p.id}`}
                        aria-label={`Edit ${p.title}`}
                        className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
                      >
                        <PencilLine className="size-3.5" aria-hidden />
                      </Link>
                      <ConfirmButton label="Delete" action={deletePostAction.bind(null, p.id)} />
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
