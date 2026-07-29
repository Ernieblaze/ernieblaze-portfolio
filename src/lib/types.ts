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
