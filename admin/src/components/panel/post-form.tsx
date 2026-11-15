"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { savePostAction } from "@/lib/actions/content";
import type { PostFormValues } from "@/lib/data/content";
import type { FormState } from "@/lib/validation";
import { ImageField } from "./image-field";

export function PostForm({ post }: { post: PostFormValues }) {
  const [state, action] = useActionState(savePostAction, {} as FormState);
  const [uploading, setUploading] = useState(false);
  const e = state.errors ?? {};
  const v = (key: keyof PostFormValues) => state.values?.[key] ?? String(post[key] ?? "");

  return (
    <form action={action} className="max-w-3xl space-y-8" noValidate>
      <input type="hidden" name="id" value={post.id} />
      <FormMessage>{state.message}</FormMessage>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" error={e.title} className="sm:col-span-2">
          <Input id="title" name="title" defaultValue={v("title")} error={e.title} maxLength={140} required />
        </Field>
        <Field label="Web address" htmlFor="slug" error={e.slug} hint="Leave empty to make one from the title." optional>
          <Input id="slug" name="slug" defaultValue={v("slug")} error={e.slug} placeholder="choosing-the-perfect-sofa" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" htmlFor="status" error={e.status}>
            <Select id="status" name="status" defaultValue={v("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>
          <Field label="Date" htmlFor="publishedAt" error={e.publishedAt}>
            <Input id="publishedAt" name="publishedAt" type="date" defaultValue={v("publishedAt")} error={e.publishedAt} />
          </Field>
        </div>
        <Field label="Summary" htmlFor="excerpt" error={e.excerpt} className="sm:col-span-2" hint="One or two sentences shown in the article list." optional>
          <Textarea id="excerpt" name="excerpt" defaultValue={v("excerpt")} maxLength={300} className="min-h-20" />
        </Field>
      </div>

      <ImageField name="image" label="Cover image" defaultValue={v("image")} error={e.image} onUploadingChange={setUploading} />

      <Field
        label="Article"
        htmlFor="body"
        error={e.body}
        hint='Leave an empty line between paragraphs. Start a line with "## " for a heading.'
      >
        <Textarea id="body" name="body" defaultValue={v("body")} className="min-h-96 font-mono text-[0.85rem]" />
      </Field>

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        <SubmitButton pendingText="Saving…" disabled={uploading}>
          {post.id ? "Save article" : "Create article"}
        </SubmitButton>
        <Link href="/content/blog" className={buttonStyles({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
