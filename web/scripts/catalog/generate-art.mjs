/**
 * Writes the catalogue SVGs to public/image/catalog/:
 *   <slug>.svg      main studio shot
 *   <slug>-alt.svg  the same piece on the dark "noir" backdrop (gallery image)
 * and the wide room scenes to public/image/rooms/<name>.svg (see rooms.mjs).
 *
 * Run: node scripts/catalog/generate-art.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderRoom, renderScene } from "./art.mjs";
import { products, slugify } from "./catalog.mjs";
import { rooms } from "./rooms.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "..", "public", "image", "catalog");
mkdirSync(outDir, { recursive: true });

let bytes = 0;
for (const p of products) {
  const slug = slugify(p.name);
  const main = renderScene(p.art, slug);
  const alt = renderScene({ ...p.art, decor: (p.art.decor ?? []).filter((d) => d !== "art") }, slug, "noir");
  writeFileSync(path.join(outDir, `${slug}.svg`), main);
  writeFileSync(path.join(outDir, `${slug}-alt.svg`), alt);
  bytes += main.length + alt.length;
}
console.log(`Wrote ${products.length * 2} SVGs (${Math.round(bytes / 1024)} KB) to ${outDir}`);

const roomDir = path.join(here, "..", "..", "public", "image", "rooms");
mkdirSync(roomDir, { recursive: true });
for (const [name, spec] of Object.entries(rooms)) {
  writeFileSync(path.join(roomDir, `${name}.svg`), renderRoom(spec, `room-${name}`));
}
console.log(`Wrote ${Object.keys(rooms).length} room scenes to ${roomDir}`);
