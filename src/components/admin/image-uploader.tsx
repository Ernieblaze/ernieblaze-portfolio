"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";

const MAX_IMAGES = 3;
const ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/gif";

type ImageUploaderProps = {
  images: string[];
  onChange: (images: string[]) => void;
  onError: (message: string | null) => void;
};

/**
 * Uploads screenshots straight away and holds their URLs in form state, so the
 * project record only ever references files that already exist on disk.
 */
export function ImageUploader({ images, onChange, onError }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const remaining = MAX_IMAGES - images.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) {
      onError(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }

    setUploading(true);
    onError(null);

    const body = new FormData();
    files.forEach((file) => body.append("files", file));

    try {
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        onError(data.error ?? "Upload failed.");
        return;
      }

      onChange([...images, ...data.urls].slice(0, MAX_IMAGES));
    } catch {
      onError("Upload failed. Check the dev server is still running.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-muted font-mono text-xs tracking-wider uppercase">
          Screenshots
        </span>
        <span className="text-muted/60 font-mono text-[11px]">
          {images.length}/{MAX_IMAGES} · first one is the card image
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {images.map((src, index) => (
          <div
            key={src}
            className="group relative aspect-16/10 overflow-hidden rounded-xl border border-white/10"
          >
            <Image
              src={src}
              alt={`Screenshot ${index + 1}`}
              fill
              sizes="180px"
              className="object-cover object-top"
            />
            {index === 0 ? (
              <span className="bg-accent absolute top-1.5 left-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium text-black">
                COVER
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onChange(images.filter((item) => item !== src))}
              className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/70 text-white/80 transition-colors hover:bg-red-500 hover:text-white"
              aria-label={`Remove screenshot ${index + 1}`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        ))}

        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-muted hover:border-accent/50 hover:text-accent flex aspect-16/10 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-5" aria-hidden="true" />
            )}
            <span className="font-mono text-[11px]">
              {uploading ? "Uploading" : "Add image"}
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <p className="text-muted/60 mt-2 font-mono text-[11px]">
        PNG, JPG, WebP, AVIF or GIF · 6 MB each · saved to data/uploads
      </p>
    </div>
  );
}
