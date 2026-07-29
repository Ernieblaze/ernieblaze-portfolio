import type { ProjectInput } from "./types";
import { MAX_IMAGES_PER_PROJECT } from "./uploads";
import { IMAGE_BUCKET, storageHostname } from "./supabase";

export type Validated =
  | { ok: true; value: ProjectInput }
  | { ok: false; error: string };

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Only http(s) — a `javascript:` URL in the address bar would be a live XSS. */
function normaliseUrl(raw: string): string | null {
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/**
 * Images must be ones we produced: bundled seed art, or an object in our own
 * Supabase bucket. Anything else — including arbitrary remote URLs — is
 * dropped, so a crafted request can't point a project at someone else's host.
 */
function isOurImage(src: string): boolean {
  if (/^\/seed\/[\w.-]+$/.test(src)) return true;

  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname === storageHostname() &&
      url.pathname.startsWith(`/storage/v1/object/public/${IMAGE_BUCKET}/`)
    );
  } catch {
    return false;
  }
}

function cleanImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(isOurImage)
    .slice(0, MAX_IMAGES_PER_PROJECT);
}

/**
 * Validates and normalises an admin-submitted project. Runs on the server for
 * every write, so the client form is a convenience rather than the gate.
 */
export function validateProject(body: unknown): Validated {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const raw = body as Record<string, unknown>;
  const caseStudy = (raw.caseStudy ?? {}) as Record<string, unknown>;

  const title = str(raw.title);
  if (!title) return { ok: false, error: "Add a project title." };
  if (title.length > 90) {
    return { ok: false, error: "Keep the title under 90 characters." };
  }

  const description = str(raw.description);
  if (!description) return { ok: false, error: "Add a short description." };
  if (description.length > 200) {
    return { ok: false, error: "Keep the description under 200 characters." };
  }

  const liveUrl = normaliseUrl(str(raw.liveUrl));
  if (!liveUrl) {
    return { ok: false, error: "Add a valid live URL, starting with https://" };
  }

  const tech = (
    Array.isArray(raw.tech)
      ? raw.tech.filter((item): item is string => typeof item === "string")
      : str(raw.tech).split(",")
  )
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

  const images = cleanImages(raw.images);
  if (images.length === 0) {
    return { ok: false, error: "Upload at least one screenshot." };
  }

  return {
    ok: true,
    value: {
      title,
      slug: str(raw.slug) || undefined,
      description,
      category: str(raw.category) || "Website",
      liveUrl,
      tech,
      images,
      caseStudy: {
        problem: str(caseStudy.problem),
        solution: str(caseStudy.solution),
        result: str(caseStudy.result),
      },
      published: raw.published !== false,
    },
  };
}
