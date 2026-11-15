import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/panel/page-title";
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
    <div>
      <PageTitle title={post.id ? post.title : "New article"} description={post.id ? "Edit article" : undefined} />
      <PostForm post={post} />
    </div>
  );
}
