export type Project = {
  id: string;
  /** URL-safe identifier, also used for the per-project page at /work/[slug]. */
  slug: string;
  title: string;
  /** One line for the card. Keep it under ~110 characters. */
  description: string;
  /** e.g. "Landing Page", "E-commerce", "Redesign" */
  category: string;
  /** Live, publicly reachable URL. Shown in the browser-chrome address bar. */
  liveUrl: string;
  tech: string[];
  /** 1–3 paths under /uploads (or /seed for the bundled placeholders). */
  images: string[];
  caseStudy: {
    problem: string;
    solution: string;
    result: string;
  };
  /** Whether the project shows on the public site. */
  published: boolean;
  /** ISO 8601. Drives ordering — newest first. */
  createdAt: string;
  updatedAt: string;
};

/** Shape the admin form posts. Server fills in id/slug/timestamps. */
export type ProjectInput = Omit<
  Project,
  "id" | "slug" | "createdAt" | "updatedAt"
> & {
  slug?: string;
};

/**
 * Every piece of hand-written copy on the public site.
 *
 * `src/lib/site.ts` holds the defaults; the dashboard saves overrides to
 * Supabase and `getSiteContentSafe` merges the two. Nothing here is required to
 * exist in the database — a missing field falls back to the default, which is
 * what keeps a half-filled form from emptying the site.
 */
export type SiteContent = {
  name: string;
  domain: string;
  url: string;
  role: string;
  email: string;
  location: string;

  tagline: string;
  /** Shown under the hero headline. Two sentences, no more. */
  heroSupport: string;

  availability: {
    open: boolean;
    label: string;
    detail: string;
  };

  about: {
    heading: string;
    paragraphs: string[];
    photo: string | null;
    photoAlt: string;
  };

  skills: string[];
  stats: { value: string; label: string }[];
  services: {
    title: string;
    description: string;
    deliverables: string[];
  }[];
  socials: { name: string; handle: string; href: string }[];

  /** Structural, not content — the hrefs must match the section ids. */
  nav: { label: string; href: string }[];
};
