"use server";

import { isValidObjectId } from "mongoose";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { assertAdmin, audit } from "@/lib/auth";
import {
  bannerSchema,
  faqSchema,
  homeSchema,
  postSchema,
  settingsSchema,
  type ContentKey,
} from "@/lib/content-types";
import { connectDb } from "@/lib/db";
import { Post, SiteContent } from "@/lib/models/content";
import { refreshShop } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";
import { fieldErrors, formValues, type FormState } from "@/lib/validation";

/**
 * Website content changes. Each one checks the admin, validates, saves,
 * logs, and tells the shop to refresh the matching cache.
 */

async function saveBlock(key: ContentKey, data: unknown, admin: { id: string; username: string }) {
  await connectDb();
  await SiteContent.updateOne(
    { _id: key },
    { $set: { data, updated_at: new Date(), updated_by: admin.username } },
    { upsert: true },
  );
  await audit(admin, `content.${key}.saved`);
  const refreshed = await refreshShop("content");
  return refreshed
    ? "Saved. The shop shows the change now."
    : "Saved. The shop could not be reached, so it will show the change within a few hours (or after a restart).";
}

function formBlockAction<S extends z.ZodType>(key: ContentKey, schema: S, read: (fd: FormData) => unknown) {
  return async (_prev: FormState, formData: FormData): Promise<FormState> => {
    const admin = await assertAdmin();
    const values = formValues(formData);
    const parsed = schema.safeParse(read(formData));
    if (!parsed.success) {
      return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields.", values };
    }
    return { ok: true, message: await saveBlock(key, parsed.data, admin) };
  };
}

const fields = (fd: FormData, names: string[]) =>
  Object.fromEntries(names.map((n) => [n, typeof fd.get(n) === "string" ? fd.get(n) : ""]));

const saveSettings = formBlockAction("settings", settingsSchema, (fd) =>
  fields(fd, ["name", "tagline", "description", "phone", "email", "address", "whatsapp", "hours", "instagram", "facebook", "youtube", "pinterest"]),
);
export async function saveSettingsAction(prev: FormState, fd: FormData) {
  return saveSettings(prev, fd);
}

const saveHome = formBlockAction("home", homeSchema, (fd) =>
  fields(fd, ["eyebrow", "line1", "line2", "line3", "sentence", "primaryLabel", "primaryHref", "secondaryLabel", "secondaryHref"]),
);
export async function saveHomeAction(prev: FormState, fd: FormData) {
  return saveHome(prev, fd);
}

const saveBanner = formBlockAction("banner", bannerSchema, (fd) => ({
  ...fields(fd, ["text", "linkLabel", "href", "startsAt", "endsAt"]),
  enabled: fd.get("enabled") === "on",
}));
export async function saveBannerAction(prev: FormState, fd: FormData) {
  return saveBanner(prev, fd);
}

/** The FAQ editor sends the whole list as JSON in one hidden field. */
export async function saveFaqAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await assertAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("faq") ?? ""));
  } catch {
    return { message: "Could not read the FAQ. Reload the page and try again." };
  }
  const parsed = faqSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), message: "Some questions are incomplete. Fill in or remove the highlighted ones." };
  }
  return { ok: true, message: await saveBlock("faq", parsed.data, admin) };
}

async function uniquePostSlug(wanted: string, ignoreId?: string) {
  const base = slugify(wanted) || "article";
  let slug = base;
  for (let n = 2; n < 50; n++) {
    const clash = await Post.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) });
    if (!clash) return slug;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function savePostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await assertAdmin();
  const values = formValues(formData);
  const parsed = postSchema.safeParse(
    fields(formData, ["title", "slug", "excerpt", "image", "body", "status", "publishedAt"]),
  );
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields.", values };
  }
  const data = parsed.data;
  const id = String(formData.get("id") ?? "");
  const isEdit = isValidObjectId(id);

  await connectDb();
  const slug = await uniquePostSlug(data.slug || data.title, isEdit ? id : undefined);
  const doc = {
    title: data.title,
    slug,
    excerpt: data.excerpt,
    image: data.image,
    body: data.body,
    status: data.status,
    published_at: new Date(`${data.publishedAt}T00:00:00Z`),
    updated_at: new Date(),
  };

  if (isEdit) {
    const result = await Post.updateOne({ _id: id }, { $set: doc });
    if (result.matchedCount === 0) return { message: "This article no longer exists.", values };
  } else {
    await Post.create(doc);
  }
  await audit(admin, isEdit ? "post.updated" : "post.created", data.title);
  await refreshShop("posts");
  redirect("/content/blog");
}

export async function deletePostAction(id: string): Promise<FormState> {
  const admin = await assertAdmin();
  if (!isValidObjectId(id)) return { message: "Unknown article." };
  await connectDb();
  const post = await Post.findByIdAndDelete(id).select("title").lean();
  await audit(admin, "post.deleted", post?.title ?? id);
  await refreshShop("posts");
  return { ok: true, message: "Article deleted." };
}
