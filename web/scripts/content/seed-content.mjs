/**
 * Copy the website's built-in text (lib/site.ts, lib/content.ts and the home
 * hero) into MongoDB, so the admin panel starts with the real content.
 *
 *   node --experimental-strip-types scripts/content/seed-content.mjs
 *
 * Only fills blocks that do not exist yet; nothing already edited in the
 * admin panel is overwritten. Add --force to overwrite everything.
 *
 * Reads MONGODB_URI from the environment or web/.env.local.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "..", "..", "src", "lib");
const force = process.argv.includes("--force");

const uri =
  process.env.MONGODB_URI ??
  readFileSync(path.join(here, "..", "..", ".env.local"), "utf8").match(/^MONGODB_URI=(.*)$/m)?.[1]?.trim();
if (!uri) throw new Error("MONGODB_URI is not set.");

// Both files are plain data with no imports, so Node can load them directly.
const { site } = await import(pathToFileURL(path.join(src, "site.ts")).href);
const { faqGroups, blogPosts } = await import(pathToFileURL(path.join(src, "content.ts")).href);

const blocks = {
  settings: {
    name: site.name,
    tagline: site.tagline,
    description: site.description,
    phone: site.contact.phone,
    email: site.contact.email,
    address: site.contact.address,
    whatsapp: "",
    hours: "",
    instagram: "",
    facebook: "",
    youtube: "",
    pinterest: "",
  },
  // Same text as defaultHome in lib/data/content.ts.
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
  },
  banner: { enabled: false, text: "", linkLabel: "", href: "", startsAt: "", endsAt: "" },
  faq: { groups: faqGroups },
};

await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
const db = mongoose.connection;
const content = db.collection("sitecontent");
const posts = db.collection("posts");
const now = new Date();

for (const [key, data] of Object.entries(blocks)) {
  const exists = await content.findOne({ _id: key });
  if (exists && !force) {
    console.log(`skip   ${key} (already edited)`);
    continue;
  }
  await content.updateOne(
    { _id: key },
    { $set: { data, updated_at: now, updated_by: "seed-content script" } },
    { upsert: true },
  );
  console.log(`wrote  ${key}`);
}

await posts.createIndex({ slug: 1 }, { unique: true });
for (const post of blogPosts) {
  const exists = await posts.findOne({ slug: post.slug });
  if (exists && !force) {
    console.log(`skip   post ${post.slug}`);
    continue;
  }
  const body = post.body
    .map((b) => (b.heading ? `## ${b.heading}\n\n${b.text}` : b.text))
    .join("\n\n");
  await posts.updateOne(
    { slug: post.slug },
    {
      $set: {
        title: post.title,
        excerpt: post.excerpt,
        image: post.image,
        body,
        status: "published",
        published_at: new Date(`${post.date}T00:00:00Z`),
        updated_at: now,
      },
      $setOnInsert: { created_at: now },
    },
    { upsert: true },
  );
  console.log(`wrote  post ${post.slug}`);
}

await mongoose.disconnect();
console.log("Done. Restart the shop or save once in the admin panel to refresh its cache.");
