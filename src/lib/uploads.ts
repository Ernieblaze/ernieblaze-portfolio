import "server-only";

import { randomUUID } from "node:crypto";

import { IMAGE_BUCKET, supabase } from "./supabase";

/**
 * Image uploads, backed by Supabase Storage.
 *
 * Files do NOT go to `public/` or anywhere else on disk: Vercel's filesystem
 * is ephemeral and per-instance, so a locally written image would vanish on
 * the next deploy and would not exist for other serverless instances in the
 * meantime. The bucket is public-read, and stored image URLs are the bucket's
 * public URLs.
 *
 * SVG is not accepted — SVGs can carry scripts, and these files are served
 * under a domain the site trusts. The bundled placeholder art in `public/seed`
 * is authored here, so it is exempt.
 */

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export const MAX_UPLOAD_MB = MAX_BYTES / (1024 * 1024);
export const MAX_IMAGES_PER_PROJECT = 3;

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Writes raw image bytes to the bucket and returns their public URL.
 *
 * Shared by hand-uploaded files and by auto-captured screenshots, so both go
 * through the same format check, the same size limit, and the same generated
 * object key.
 */
export async function saveImageBytes(
  bytes: Uint8Array,
  contentType: string,
  label: string,
): Promise<UploadResult> {
  const extension = ALLOWED[contentType];
  if (!extension) {
    return {
      ok: false,
      error: `${label}: unsupported format. Use PNG, JPG, WebP, AVIF, or GIF.`,
    };
  }

  if (bytes.byteLength > MAX_BYTES) {
    return {
      ok: false,
      error: `${label}: too large. The limit is ${MAX_UPLOAD_MB} MB.`,
    };
  }

  // The object key is generated, never taken from the client, so an uploaded
  // filename can't traverse the bucket or overwrite an existing image.
  const key = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;

  const { error } = await supabase()
    .storage.from(IMAGE_BUCKET)
    .upload(key, bytes, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    return { ok: false, error: `${label}: upload failed. ${error.message}` };
  }

  const { data } = supabase().storage.from(IMAGE_BUCKET).getPublicUrl(key);
  return { ok: true, url: data.publicUrl };
}

export async function saveUpload(file: File): Promise<UploadResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return saveImageBytes(bytes, file.type, file.name);
}

/**
 * Removes an uploaded image. Accepts the stored public URL and ignores
 * anything that isn't one of ours — seed art lives in the repo, not the bucket.
 */
export async function deleteUpload(url: string): Promise<void> {
  const marker = `/${IMAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;

  const key = url.slice(index + marker.length).split("?")[0];
  if (!key || !/^[\w.-]+$/.test(key)) return;

  await supabase().storage.from(IMAGE_BUCKET).remove([key]);
}
