import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ConfirmButton } from "@/components/panel/controls";
import { PageTitle } from "@/components/panel/page-title";
import { buttonStyles } from "@/components/ui/button";
import { deletePostAction } from "@/lib/actions/content";
import { requireAdmin } from "@/lib/auth";
import { getPostRows } from "@/lib/data/content";
import { cn, formatDate, shopUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogListPage() {
  await requireAdmin();
  const posts = await getPostRows();

  return (
    <div>
      <PageTitle
        title="Blog"
        description={
          posts.length
            ? `${posts.length} articles. Only published articles with a date up to today appear in the shop's Journal.`
            : "No articles in the database yet: the shop shows its built-in articles until you add one."
        }
      >
        <Link href="/content/blog/new" className={buttonStyles()}>
          <Plus aria-hidden />
          New article
        </Link>
      </PageTitle>

      <div className="relative overflow-x-auto rounded-card ring-1 ring-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-surface-2 text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <Link href={`/content/blog/${p.id}`} className="font-medium hover:text-accent">
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted">/blog/{p.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      p.status === "published"
                        ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                        : "bg-surface-2 text-muted",
                    )}
                  >
                    {p.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(p.publishedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {p.status === "published" && (
                      <a
                        href={shopUrl(`/blog/${p.slug}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline underline-offset-4 hover:text-accent"
                      >
                        View
                      </a>
                    )}
                    <Link href={`/content/blog/${p.id}`} className="text-xs underline underline-offset-4 hover:text-accent">
                      Edit
                    </Link>
                    <ConfirmButton label="Delete" action={deletePostAction.bind(null, p.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No articles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
