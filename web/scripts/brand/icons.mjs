/**
 * Writes the window-mark app icons: app/icon.svg, plus PNGs rendered with
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
// Same geometry as MARK in src/components/layout/logo-mark.tsx.
const frame = "M12 7h24a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V12a5 5 0 0 1 5-5z";
const mullions = "M24 7v34M7 24h34";
const pane = "M11.5 11.5h10v10h-10z";

// rx 0 for maskable/apple icons (the OS rounds them), 11 for the favicon.
const icon = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3cf9e"/><stop offset="1" stop-color="#e3a56f"/></linearGradient></defs><rect width="48" height="48" rx="${rx}" fill="#0c0a09"/><g transform="translate(24 24) scale(0.68) translate(-24 -24)" fill="none"><path d="${pane}" fill="url(#s)"/><path d="${frame}" stroke="#f5f0e8" stroke-width="3.4"/><path d="${mullions}" stroke="#f5f0e8" stroke-width="2.7"/></g></svg>`;

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
