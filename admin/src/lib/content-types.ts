import { z } from "zod";

/**
 * Shape and rules for each editable block of the website. The shop reads the
 * same fields (web/src/lib/data/content.ts) and falls back to its built-in
 * text for anything missing.
 */

const text = (max: number) => z.string().trim().max(max).default("");
const required = (label: string, max: number) => z.string().trim().min(1, `Enter ${label}`).max(max);

/** A link inside the site ("/shop") or a full https:// address. */
const href = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//.test(v), {
    message: "Use a path like /shop or a full https:// address",
  })
  .default("");

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\//.test(v), { message: "Use a full https:// address" })
  .default("");

export const settingsSchema = z.object({
  name: required("the store name", 80),
  tagline: text(160),
  description: text(300),
  phone: text(30),
  email: z.union([z.string().trim().toLowerCase().email("Enter a valid email address"), z.literal("")]).default(""),
  address: text(200),
  whatsapp: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9 ]{10,16}$/, "Digits only, with country code, e.g. +91 98250 00000")
    .default(""),
  hours: text(200),
  instagram: optionalUrl,
  facebook: optionalUrl,
  youtube: optionalUrl,
  pinterest: optionalUrl,
});
export type Settings = z.infer<typeof settingsSchema>;

export const homeSchema = z.object({
  eyebrow: text(80),
  line1: required("the first headline line", 40),
  line2: required("the second headline line", 40),
  line3: required("the third headline line", 40),
  sentence: text(300),
  primaryLabel: required("a button label", 40),
  primaryHref: href,
  secondaryLabel: text(40),
  secondaryHref: href,
});
export type HomeContent = z.infer<typeof homeSchema>;

export const bannerSchema = z
  .object({
    enabled: z.boolean().default(false),
    text: text(160),
    linkLabel: text(40),
    href,
    startsAt: text(20), // "YYYY-MM-DD" or ""
    endsAt: text(20),
  })
  .refine((b) => !b.enabled || b.text.length > 0, { message: "Write the announcement text", path: ["text"] })
  .refine((b) => !b.startsAt || !b.endsAt || b.startsAt <= b.endsAt, {
    message: "The end date must be after the start date",
    path: ["endsAt"],
  });
export type Banner = z.infer<typeof bannerSchema>;

export const faqSchema = z.object({
  groups: z
    .array(
      z.object({
        title: required("a group title", 80),
        items: z
          .array(z.object({ q: required("the question", 200), a: required("the answer", 2000) }))
          .max(40),
      }),
    )
    .max(12),
});
export type Faq = z.infer<typeof faqSchema>;

export const postSchema = z.object({
  title: required("a title", 140),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes")
    .default(""),
  excerpt: text(300),
  image: text(500),
  body: z.string().trim().max(30000).default(""),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
});

export const CONTENT_KEYS = ["settings", "home", "banner", "faq"] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];

/** Shown in the forms until something is saved (same text the shop falls back to). */
export const defaults = {
  settings: {
    name: "Home Decor Furniture",
    tagline: "HomeSphere AR: see it in your room before you buy.",
    description:
      "Furniture for modern living. Preview pieces in 3D and place them in your own room with AR before you buy.",
    phone: "+91 9825000000",
    email: "support@homedecorfurniture.com",
    address: "Ahmedabad, Gujarat, India",
    whatsapp: "",
    hours: "",
    instagram: "",
    facebook: "",
    youtube: "",
    pinterest: "",
  } satisfies Settings,
  home: {
    eyebrow: "Home Decor Furniture · Since 2014",
    line1: "Furniture for",
    line2: "the room",
    line3: "you live in",
    sentence:
      "Considered pieces in honest materials. Place any of them in your own room with your phone, and buy only when it fits.",
    primaryLabel: "Explore the collection",
    primaryHref: "/shop",
    secondaryLabel: "Try it in your room",
    secondaryHref: "/ar/live",
  } satisfies HomeContent,
  banner: { enabled: false, text: "", linkLabel: "", href: "", startsAt: "", endsAt: "" } satisfies Banner,
  faq: { groups: [] } satisfies Faq,
};
