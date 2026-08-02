import "server-only";

import type { SiteContent } from "./types";
import { site } from "./site";
import { supabase, SITE_CONTENT_TABLE } from "./supabase";

/**
 * The live copy for the public site: defaults from `site.ts` with whatever the
 * dashboard has saved layered on top.
 *
 * Stored as a single JSON row rather than a column per field. Copy is a shape
 * that changes — a new section, another stat, a fourth paragraph — and a table
 * migration for every wording change would make the thing nobody wants to
 * touch. The trade-off is that Postgres cannot validate it, so
 * `validateSiteContent` on the way in is not optional.
 */

const ROW_ID = "default";

/**
 * Overrides win, but only where they are actually present.
 *
 * A field the dashboard has never saved, or one saved empty, falls through to
 * the default — so a partially filled form cannot blank out a section of the
 * live site. Arrays replace wholesale rather than merging element by element:
 * for a list of services, "what the editor last saved" is the whole answer.
 */
function merge(defaults: SiteContent, overrides: Partial<SiteContent>): SiteContent {
  const text = (value: unknown, fallback: string) =>
    typeof value === "string" && value.trim() ? value.trim() : fallback;

  const list = <T,>(value: unknown, fallback: T[]): T[] =>
    Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;

  const about = (overrides.about ?? {}) as Partial<SiteContent["about"]>;
  const availability = (overrides.availability ??
    {}) as Partial<SiteContent["availability"]>;

  return {
    name: text(overrides.name, defaults.name),
    domain: text(overrides.domain, defaults.domain),
    url: text(overrides.url, defaults.url),
    role: text(overrides.role, defaults.role),
    email: text(overrides.email, defaults.email),
    location: text(overrides.location, defaults.location),

    tagline: text(overrides.tagline, defaults.tagline),
    heroSupport: text(overrides.heroSupport, defaults.heroSupport),

    availability: {
      // A boolean has no "empty" — false is a real choice and must survive.
      open:
        typeof availability.open === "boolean"
          ? availability.open
          : defaults.availability.open,
      label: text(availability.label, defaults.availability.label),
      detail: text(availability.detail, defaults.availability.detail),
    },

    about: {
      heading: text(about.heading, defaults.about.heading),
      paragraphs: list(about.paragraphs, defaults.about.paragraphs),
      // Null is meaningful here: it means "no photo", so it is not a fallback.
      photo:
        about.photo === null || typeof about.photo === "string"
          ? about.photo
          : defaults.about.photo,
      photoAlt: text(about.photoAlt, defaults.about.photoAlt),
    },

    skills: list(overrides.skills, defaults.skills),
    stats: list(overrides.stats, defaults.stats),
    services: list(overrides.services, defaults.services),
    socials: list(overrides.socials, defaults.socials),

    // Not editable: the hrefs have to match the section ids on the page.
    nav: defaults.nav,
  };
}

/** Reads the saved overrides. Throws — admin routes want to know. */
export async function getSiteOverrides(): Promise<Partial<SiteContent>> {
  const { data, error } = await supabase()
    .from(SITE_CONTENT_TABLE)
    .select("data")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) throw new Error(`Could not load site content: ${error.message}`);
  return (data?.data ?? {}) as Partial<SiteContent>;
}

/** The merged content, for admin screens that need to fail loudly. */
export async function getSiteContent(): Promise<SiteContent> {
  return merge(site, await getSiteOverrides());
}

/**
 * Same, but never throws.
 *
 * The public site is almost entirely this copy, so an unreachable Supabase must
 * degrade to the defaults rather than take every page down. This is what the
 * public pages call, and it is why the build does not need a database.
 */
export async function getSiteContentSafe(): Promise<SiteContent> {
  try {
    return await getSiteContent();
  } catch (error) {
    console.error(
      "[site-content] Falling back to the defaults in src/lib/site.ts:",
      error,
    );
    return site;
  }
}

/** Writes the overrides. The row is created on first save. */
export async function saveSiteContent(
  value: Partial<SiteContent>,
): Promise<SiteContent> {
  const { error } = await supabase()
    .from(SITE_CONTENT_TABLE)
    .upsert(
      { id: ROW_ID, data: value, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );

  if (error) throw new Error(`Could not save site content: ${error.message}`);
  return merge(site, value);
}
