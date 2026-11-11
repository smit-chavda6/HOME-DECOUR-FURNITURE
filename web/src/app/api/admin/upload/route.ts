import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";

/**
 * Admin image upload. POST multipart form with "file".
 *
 * - With BLOB_READ_WRITE_TOKEN set (Vercel Blob), the image goes to cloud
 *   storage and a full https URL is returned. This is what production needs,
 *   because serverless hosts cannot keep files written to disk.
 * - Without it, in local development, the image is saved to public/uploads.
 */

const MAX_BYTES = 4 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function json(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return json("Not allowed.", 403);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json("Choose an image to upload.", 400);

  const extension = EXTENSIONS[file.type];
  if (!extension) return json("Use a JPG, PNG, WebP or AVIF image.", 400);
  if (file.size > MAX_BYTES) return json("The image must be under 4 MB.", 400);

  // Never trust the uploaded file name; build a safe one.
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${name}`, file, {
      access: "public",
      contentType: file.type,
    });
    return Response.json({ url: blob.url });
  }

  if (process.env.NODE_ENV === "production") {
    return json(
      "Image storage is not configured. Add BLOB_READ_WRITE_TOKEN (Vercel Blob) to enable uploads.",
      503,
    );
  }

  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
  return Response.json({ url: `uploads/${name}` });
}
