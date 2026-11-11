import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { blogPosts } from "@/lib/content";
import { assetUrl } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  return post ? { title: post.title, description: post.excerpt } : { title: "Article not found" };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <article className="container-page pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          All articles
        </Link>
        <p className="mt-8 text-sm text-muted">
          <time dateTime={post.date}>{dateFormat.format(new Date(post.date))}</time> · {post.readingMinutes} min read
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight font-medium tracking-tight sm:text-5xl">{post.title}</h1>
        <p className="mt-5 text-xl leading-relaxed text-muted">{post.excerpt}</p>
      </div>

      <div className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl overflow-hidden rounded-panel bg-surface-2">
        <Image src={assetUrl(post.image)!} alt="" fill preload sizes="(min-width: 1024px) 64rem, 100vw" className="object-cover" />
      </div>

      <div className="mx-auto mt-12 max-w-2xl space-y-6 text-lg leading-relaxed">
        {post.body.map((block, i) => (
          <div key={i}>
            {block.heading && <h2 className="mb-2 font-display text-2xl font-medium">{block.heading}</h2>}
            <p className={block.heading ? "text-muted" : ""}>{block.text}</p>
          </div>
        ))}
        <div className="border-t border-line pt-8">
          <Link href="/shop" className={buttonStyles()}>Browse the collection</Link>
        </div>
      </div>
    </article>
  );
}
