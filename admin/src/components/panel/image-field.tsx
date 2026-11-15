"use client";

import { useState } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { assetUrl } from "@/lib/utils";

/** Upload an image and return its URL, or throw with a readable message. */
async function uploadImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return data.url;
}

/**
 * Image path/URL input with an Upload button and a preview.
 * `onUploadingChange` lets the parent form disable Save while a file uploads.
 */
export function ImageField({
  name,
  label,
  defaultValue,
  error,
  hint = "Upload a file or paste a path or URL.",
  onUploadingChange,
}: {
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
  hint?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const preview = assetUrl(value);

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-xs text-muted">No image</span>
        )}
      </div>
      <Field label={label} htmlFor={name} error={error || uploadError} hint={hint}>
        <div className="flex gap-2">
          <Input id={name} name={name} value={value} onChange={(ev) => setValue(ev.target.value)} error={error} />
          <label className={buttonStyles({ variant: "outline", className: "cursor-pointer" })}>
            {uploading ? <LoaderCircle className="animate-spin" aria-hidden /> : <ImageUp aria-hidden />}
            Upload
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={uploading}
              onChange={async (ev) => {
                const file = ev.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setUploadError("");
                try {
                  setValue(await uploadImage(file));
                } catch (err) {
                  setUploadError((err as Error).message);
                } finally {
                  setBusy(false);
                  ev.target.value = "";
                }
              }}
            />
          </label>
        </div>
      </Field>
    </div>
  );
}
