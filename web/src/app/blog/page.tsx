import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getPosts } from "@/lib/data/content";
import { assetUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Journal",
  description: "Ideas, care guides and buying advice for a more beautiful home.",
};

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function BlogPage() {
  const [lead, ...rest] = await getPosts();

  return (
    <>
      <PageHeader
        eyebrow="Journal"
        title={<>Ideas for a home <em className="text-gradient">you love</em></>}
        description="Buying advice, care guides and the trends worth trying."
        crumbs={[{ label: "Journal" }]}
      />

      <div className="container-page">
        {!lead && <p className="rounded-card bg-surface-2 px-6 py-16 text-center text-muted">New articles are on the way.</p>}
        {lead && <Link href={`/blog/${lead.slug}`} className="group grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="relative aspect-[4/3] overflow-hidden rounded-panel bg-surface-2">
            <Image src={assetUrl(lead.image)!} alt="" fill preload sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div>
            <p className="text-sm text-muted">
              <time dateTime={lead.date}>{dateFormat.format(new Date(lead.date))}</time> · {lead.readingMinutes} min read
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-medium tracking-tight group-hover:text-accent sm:text-4xl">
              {lead.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{lead.excerpt}</p>
          </div>
        </Link>}

        {rest.length > 0 && <ul className="mt-20 grid gap-x-6 gap-y-14 border-t border-line pt-14 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-2">
                  <Image src={assetUrl(post.image)!} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <p className="mt-5 text-sm text-muted">
                  <time dateTime={post.date}>{dateFormat.format(new Date(post.date))}</time> · {post.readingMinutes} min read
                </p>
                <h2 className="mt-2 font-display text-2xl leading-snug font-medium group-hover:text-accent">{post.title}</h2>
                <p className="mt-2 leading-relaxed text-muted">{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>}
      </div>
    </>
  );
}
