/**
 * Writes the HD monogram app icons: app/icon.svg, plus PNGs rendered with
 * headless Chrome (app/apple-icon.png, public/icon-192.png, public/icon-512.png).
 *
 * Run: node scripts/brand/icons.mjs
 * favicon.ico is made from public/icon-512.png (rounded, 16/32/48 px) with Pillow.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const frame = "M10 9V39M24 9V39M24 9h4a11 11 0 0 1 11 11v8a11 11 0 0 1-11 11h-4";
const bar = "M10 24H24";

// rx 0 for maskable/apple icons (the OS rounds them), 11 for the favicon.
const icon = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="${rx}" fill="#0f0e0d"/><g transform="translate(24 24) scale(0.66) translate(-24.5 -24)" fill="none" stroke-linecap="square" stroke-width="3.4"><path d="${frame}" stroke="#f2eee8"/><path d="${bar}" stroke="#e3a56f"/></g></svg>`;

writeFileSync(path.join(root, "src/app/icon.svg"), icon(11));

const chrome = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const tmp = mkdtempSync(path.join(tmpdir(), "hd-icons-"));
const src = path.join(tmp, "icon.svg");
writeFileSync(src, icon(0));
for (const [out, size] of [["src/app/apple-icon.png", 180], ["public/icon-192.png", 192], ["public/icon-512.png", 512]]) {
  const html = path.join(tmp, `i${size}.html`);
  writeFileSync(html, `<html><body style="margin:0"><img src="icon.svg" width="${size}" height="${size}" style="display:block"></body></html>`);
  execFileSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${path.join(tmp, "prof")}`, `--window-size=${size},${size}`, `--screenshot=${path.join(root, out)}`, `file:///${html.replaceAll("\\", "/")}`], { stdio: "ignore" });
  console.log("wrote", out);
}
