import type { ProjectInput, SiteContent } from "./types";
import { MAX_IMAGES_PER_PROJECT } from "./uploads";
import { IMAGE_BUCKET, storageHostname } from "./supabase";

export type Validated =
  | { ok: true; value: ProjectInput }
  | { ok: false; error: string };

export type ValidatedContent =
  | { ok: true; value: Partial<SiteContent> }
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

/* -------------------------------------------------------------- site content */

const LIMITS = {
  short: 120,
  line: 300,
  paragraph: 1200,
  listItem: 80,
  maxParagraphs: 8,
  maxSkills: 24,
  maxStats: 6,
  maxServices: 10,
  maxSocials: 8,
  maxDeliverables: 6,
} as const;

function clamp(value: unknown, max: number): string {
  return str(value).slice(0, max);
}

function strings(value: unknown, maxItems: number, maxLength: number): string[] {
  const raw = Array.isArray(value)
    ? value
    : str(value)
        .split(/\r?\n/)
        .filter(Boolean);

  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * Only our own bucket, the bundled seed art, or nothing.
 *
 * The about photo is the one image in this payload, and it goes through the
 * same gate as project screenshots — otherwise the copy editor becomes a way to
 * hotlink an arbitrary host from the front page.
 */
function cleanPhoto(value: unknown): string | null {
  const src = str(value);
  if (!src) return null;
  return isOurImage(src) ? src : null;
}

/**
 * Validates admin-submitted site copy.
 *
 * Deliberately forgiving about *missing* fields — an absent key means "leave
 * the default", which is what lets the dashboard save one section without
 * having to round-trip the whole document. It is strict about the fields that
 * are present: everything is trimmed and length-capped, links must be http(s),
 * and the photo must be an image we host.
 */
export function validateSiteContent(body: unknown): ValidatedContent {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const raw = body as Record<string, unknown>;
  const about = (raw.about ?? {}) as Record<string, unknown>;
  const availability = (raw.availability ?? {}) as Record<string, unknown>;

  const name = clamp(raw.name, LIMITS.short);
  if (!name) return { ok: false, error: "Add your name." };

  const email = str(raw.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Add a valid email address." };
  }

  const url = normaliseUrl(str(raw.url));
  if (!url) {
    return { ok: false, error: "Add a valid site URL, starting with https://" };
  }

  const socials: SiteContent["socials"] = [];
  if (Array.isArray(raw.socials)) {
    for (const entry of raw.socials.slice(0, LIMITS.maxSocials)) {
      const item = (entry ?? {}) as Record<string, unknown>;
      const href = normaliseUrl(str(item.href));
      const socialName = clamp(item.name, LIMITS.listItem);
      // A link with no destination is dropped rather than rejected, so one
      // half-typed row doesn't block saving the rest of the page.
      if (!href || !socialName) continue;
      socials.push({
        name: socialName,
        handle: clamp(item.handle, LIMITS.listItem),
        href,
      });
    }
  }

  const stats: SiteContent["stats"] = [];
  if (Array.isArray(raw.stats)) {
    for (const entry of raw.stats.slice(0, LIMITS.maxStats)) {
      const item = (entry ?? {}) as Record<string, unknown>;
      const value = clamp(item.value, LIMITS.listItem);
      const label = clamp(item.label, LIMITS.short);
      if (!value && !label) continue;
      stats.push({ value, label });
    }
  }

  const services: SiteContent["services"] = [];
  if (Array.isArray(raw.services)) {
    for (const entry of raw.services.slice(0, LIMITS.maxServices)) {
      const item = (entry ?? {}) as Record<string, unknown>;
      const title = clamp(item.title, LIMITS.short);
      if (!title) continue;
      services.push({
        title,
        description: clamp(item.description, LIMITS.paragraph),
        deliverables: strings(
          item.deliverables,
          LIMITS.maxDeliverables,
          LIMITS.listItem,
        ),
      });
    }
  }

  return {
    ok: true,
    value: {
      name,
      domain: clamp(raw.domain, LIMITS.short),
      url,
      role: clamp(raw.role, LIMITS.short),
      email,
      location: clamp(raw.location, LIMITS.line),

      tagline: clamp(raw.tagline, LIMITS.line),
      heroSupport: clamp(raw.heroSupport, LIMITS.paragraph),

      availability: {
        open: availability.open !== false,
        label: clamp(availability.label, LIMITS.short),
        detail: clamp(availability.detail, LIMITS.line),
      },

      about: {
        heading: clamp(about.heading, LIMITS.line),
        paragraphs: strings(
          about.paragraphs,
          LIMITS.maxParagraphs,
          LIMITS.paragraph,
        ),
        photo: cleanPhoto(about.photo),
        photoAlt: clamp(about.photoAlt, LIMITS.short) || name,
      },

      skills: strings(raw.skills, LIMITS.maxSkills, LIMITS.listItem),
      stats,
      services,
      socials,
    },
  };
}
