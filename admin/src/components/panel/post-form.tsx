"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, FileText, ImageIcon, PenLine, Settings2 } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { savePostAction } from "@/lib/actions/content";
import type { PostFormValues } from "@/lib/data/content";
import { assetUrl } from "@/lib/utils";
import type { FormState } from "@/lib/validation";
import { ImageField } from "./image-field";

function Group({ icon: Icon, title, hint, children }: { icon: typeof FileText; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-surface p-5 ring-1 ring-line sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** The article as a reader sees it, from the current fields. */
function ArticlePreview({ title, excerpt, image, body }: { title: string; excerpt: string; image: string; body: string }) {
  const cover = assetUrl(image);
  const blocks = body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, 6);
  const words = body.split(/\s+/).filter(Boolean).length;
  return (
    <article className="overflow-hidden rounded-card bg-surface-solid ring-1 ring-line">
      <div className="aspect-[16/9] bg-surface-2">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-muted">
            <ImageIcon className="size-7" aria-hidden />
          </span>
        )}
      </div>
      <div className="max-h-[26rem] overflow-hidden p-5 [mask-image:linear-gradient(to_bottom,black_80%,transparent)]">
        <p className="eyebrow">{Math.max(1, Math.round(words / 200))} min read</p>
        <h3 className="mt-2 font-display text-xl leading-tight font-semibold tracking-tight">{title || "Your title"}</h3>
        {excerpt && <p className="mt-2 text-sm text-muted">{excerpt}</p>}
        <div className="mt-4 space-y-3 text-[0.82rem] leading-relaxed">
          {blocks.length === 0 && <p className="text-muted">Start writing and the article appears here.</p>}
          {blocks.map((b, i) =>
            b.startsWith("## ") ? (
              <h4 key={i} className="pt-1 font-display text-base font-semibold">
                {b.slice(3)}
              </h4>
            ) : (
              <p key={i} className={i > 0 ? "text-muted" : ""}>
                {b}
              </p>
            ),
          )}
        </div>
      </div>
    </article>
  );
}

export function PostForm({ post }: { post: PostFormValues }) {
  const [state, action] = useActionState(savePostAction, {} as FormState);
  const [uploading, setUploading] = useState(false);
  const e = state.errors ?? {};
  const v = (key: keyof PostFormValues) => state.values?.[key] ?? String(post[key] ?? "");
  const [live, setLive] = useState({ title: v("title"), excerpt: v("excerpt"), image: v("image"), body: v("body") });

  return (
    <form
      action={action}
      noValidate
      onInput={(ev) => {
        const t = ev.target as HTMLInputElement;
        if (t.name in live) setLive((p) => ({ ...p, [t.name]: t.value }));
      }}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]"
    >
      <div className="min-w-0 space-y-6">
        <input type="hidden" name="id" value={post.id} />
        <FormMessage>{state.message}</FormMessage>

        <Group icon={FileText} title="Headline">
          <div className="grid gap-5">
            <Field label="Title" htmlFor="title" error={e.title}>
              <Input id="title" name="title" defaultValue={v("title")} error={e.title} maxLength={140} required className="h-12 font-display text-base font-semibold" />
            </Field>
            <Field label="Summary" htmlFor="excerpt" error={e.excerpt} hint="One or two sentences shown in the article list." optional>
              <Textarea id="excerpt" name="excerpt" defaultValue={v("excerpt")} maxLength={300} className="min-h-20" />
            </Field>
          </div>
        </Group>

        <Group icon={ImageIcon} title="Cover">
          <ImageField
            name="image"
            label="Cover image"
            defaultValue={v("image")}
            error={e.image}
            onUploadingChange={setUploading}
            onValueChange={(image) => setLive((p) => ({ ...p, image }))}
          />
        </Group>

        <Group icon={PenLine} title="Article" hint='Leave an empty line between paragraphs. Start a line with "## " for a heading.'>
          <Field label="Text" htmlFor="body" error={e.body}>
            <Textarea id="body" name="body" defaultValue={v("body")} className="min-h-96 font-mono text-[0.85rem] leading-relaxed" />
          </Field>
        </Group>

        <Group icon={Settings2} title="Publishing">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Status" htmlFor="status" error={e.status}>
              <Select id="status" name="status" defaultValue={v("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <Field label="Date" htmlFor="publishedAt" error={e.publishedAt}>
              <Input id="publishedAt" name="publishedAt" type="date" defaultValue={v("publishedAt")} error={e.publishedAt} />
            </Field>
            <Field label="Web address" htmlFor="slug" error={e.slug} hint="Empty = made from the title." optional>
              <Input id="slug" name="slug" defaultValue={v("slug")} error={e.slug} placeholder="choosing-a-sofa" />
            </Field>
          </div>
        </Group>

        <div className="glass sticky bottom-3 z-10 !bg-surface-solid/90 shadow-[var(--shadow-lift)] flex flex-wrap items-center gap-3 rounded-full p-2">
          <SubmitButton size="lg" pendingText="Saving…" disabled={uploading}>
            {post.id ? "Save article" : "Create article"}
          </SubmitButton>
          <Link href="/content/blog" className={buttonStyles({ variant: "ghost", size: "lg" })}>
            Cancel
          </Link>
        </div>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Eye className="size-3.5" aria-hidden />
          Live preview
        </p>
        <ArticlePreview {...live} />
      </aside>
    </form>
  );
}
