import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { audit, getCurrentAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Image upload for signed-in admins. POST multipart form with "file".
 *
 * - With BLOB_READ_WRITE_TOKEN (Vercel Blob) the image goes to cloud storage
 *   and a full https URL is returned. Production needs this.
 * - Locally without it, the file is saved into the shop's public/uploads
 *   folder (SHOP_PUBLIC_DIR, default ../web/public) so the shop can show it.
 *
 * The file type is checked from its first bytes, not from what the browser
 * claims, and the stored name is generated, never taken from the upload.
 */

const MAX_BYTES = 4 * 1024 * 1024;

function sniff(bytes: Uint8Array): { ext: string; type: string } | null {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", type: "image/webp" };
  if (ascii(4, 8) === "ftyp" && /^avi[fs]$/.test(ascii(8, 12))) return { ext: "avif", type: "image/avif" };
  return null;
}

function json(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return json("Not allowed.", 403);

  // Same-site check on top of the strict cookie: refuse uploads started elsewhere.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json("Not allowed.", 403);

  if (!(await rateLimit(`upload:${admin.id}`, 60, 60 * 60))) {
    return json("Too many uploads. Try again later.", 429);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json("Choose an image to upload.", 400);
  if (file.size > MAX_BYTES) return json("The image must be under 4 MB.", 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return json("Use a JPG, PNG, WebP or AVIF image.", 400);

  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${kind.ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${name}`, Buffer.from(bytes), { access: "public", contentType: kind.type });
    await audit(admin, "image.uploaded", blob.url);
    return Response.json({ url: blob.url });
  }

  if (process.env.NODE_ENV === "production") {
    return json("Image storage is not configured. Add BLOB_READ_WRITE_TOKEN (Vercel Blob) to enable uploads.", 503);
  }

  const publicDir = path.resolve(process.cwd(), process.env.SHOP_PUBLIC_DIR || "../web/public");
  const directory = path.join(publicDir, "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);
  await audit(admin, "image.uploaded", `uploads/${name}`);
  return Response.json({ url: `uploads/${name}` });
}
