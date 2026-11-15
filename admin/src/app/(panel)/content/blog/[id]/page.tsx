import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilePen, FilePlus2 } from "lucide-react";
import { PageHero } from "@/components/panel/ui";
import { PostForm } from "@/components/panel/post-form";
import { requireAdmin } from "@/lib/auth";
import { getPostForEdit, type PostFormValues } from "@/lib/data/content";

export const metadata: Metadata = { title: "Article" };

/** "/content/blog/new" creates an article; any other id edits one. */
export default async function PostPage({ params }: PageProps<"/content/blog/[id]">) {
  await requireAdmin();
  const { id } = await params;

  let post: PostFormValues | null;
  if (id === "new") {
    post = {
      id: "",
      title: "",
      slug: "",
      excerpt: "",
      image: "",
      body: "",
      status: "draft",
      publishedAt: new Date().toISOString().slice(0, 10),
    };
  } else {
    post = await getPostForEdit(id);
    if (!post) notFound();
  }

  return (
    <div className="rise">
      {post.id ? (
        <PageHero icon={FilePen} eyebrow="Journal · edit" title={post.title} description="Changes appear in the shop when you save." />
      ) : (
        <PageHero icon={FilePlus2} eyebrow="Journal · new" title="A new" accent="story" description="Write it here; the preview on the right shows how readers will see it." />
      )}
      <PostForm post={post} />
    </div>
  );
}
