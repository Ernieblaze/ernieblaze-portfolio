import "server-only";

import type { Project, ProjectInput } from "./types";
import { PROJECTS_TABLE, supabase } from "./supabase";
import { deleteUpload } from "./uploads";

/**
 * Project store, backed by Supabase Postgres.
 *
 * The five exported functions below are the only way the rest of the app
 * touches project data — swapping the backend again means rewriting this file
 * and nothing else.
 */

/** Database row shape. Postgres is snake_case; the app is camelCase. */
type Row = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  live_url: string;
  tech: string[];
  images: string[];
  case_study: { problem: string; solution: string; result: string };
  published: boolean;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, slug, title, description, category, live_url, tech, images, case_study, published, created_at, updated_at";

function toProject(row: Row): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    liveUrl: row.live_url,
    tech: row.tech ?? [],
    images: row.images ?? [],
    caseStudy: row.case_study ?? { problem: "", solution: "", result: "" },
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: ProjectInput, slug: string) {
  return {
    slug,
    title: input.title,
    description: input.description,
    category: input.category,
    live_url: input.liveUrl,
    tech: input.tech,
    images: input.images,
    case_study: input.caseStudy,
    published: input.published,
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Finds a free slug. `slug` is UNIQUE in Postgres, so this is a courtesy that
 * produces a readable `-2` suffix rather than a constraint error; the database
 * remains the actual guarantee.
 */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const seed = base || "project";

  let query = supabase().from(PROJECTS_TABLE).select("slug");
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw new Error(`Could not read project slugs: ${error.message}`);

  const taken = new Set((data ?? []).map((row) => row.slug as string));
  if (!taken.has(seed)) return seed;

  let n = 2;
  while (taken.has(`${seed}-${n}`)) n += 1;
  return `${seed}-${n}`;
}

/** Every project, newest first — including unpublished drafts. Admin only. */
export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase()
    .from(PROJECTS_TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return (data as Row[]).map(toProject);
}

/** Published projects only, newest first. This is what the public site renders. */
export async function getPublishedProjects(): Promise<Project[]> {
  const { data, error } = await supabase()
    .from(PROJECTS_TABLE)
    .select(COLUMNS)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return (data as Row[]).map(toProject);
}

/**
 * Same as `getPublishedProjects`, but never throws.
 *
 * The public site is mostly hand-written copy — hero, about, services,
 * contact — and only the Work section needs the database. A missing key or an
 * unreachable Supabase must not take the whole page down with it, so callers
 * that render alongside other content use this and get an empty list plus a
 * server-side log they can act on.
 *
 * Admin routes deliberately do NOT use this: there, a broken connection is the
 * thing you need to be told about.
 */
export async function getPublishedProjectsSafe(): Promise<Project[]> {
  try {
    return await getPublishedProjects();
  } catch (error) {
    console.error(
      "[projects] Could not load projects, rendering the page without them:",
      error,
    );
    return [];
  }
}

export async function getProjectBySlug(
  slug: string,
): Promise<Project | undefined> {
  const { data, error } = await supabase()
    .from(PROJECTS_TABLE)
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Could not load project: ${error.message}`);
  return data ? toProject(data as Row) : undefined;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const slug = await uniqueSlug(slugify(input.slug || input.title));

  const { data, error } = await supabase()
    .from(PROJECTS_TABLE)
    .insert(toRow(input, slug))
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`Could not save project: ${error.message}`);
  return toProject(data as Row);
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<Project | undefined> {
  const existing = await supabase()
    .from(PROJECTS_TABLE)
    .select("slug, images")
    .eq("id", id)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Could not load project: ${existing.error.message}`);
  }
  if (!existing.data) return undefined;

  const desired = slugify(input.slug || input.title);
  const slug =
    desired === existing.data.slug ? existing.data.slug : await uniqueSlug(desired, id);

  const { data, error } = await supabase()
    .from(PROJECTS_TABLE)
    .update({ ...toRow(input, slug), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`Could not save project: ${error.message}`);

  // Drop images the edit removed, so orphans don't pile up in the bucket.
  const removed = (existing.data.images as string[]).filter(
    (src) => !input.images.includes(src),
  );
  await Promise.all(removed.map(deleteUpload));

  return toProject(data as Row);
}

export async function deleteProject(id: string): Promise<Project | undefined> {
  const { data, error } = await supabase()
    .from(PROJECTS_TABLE)
    .delete()
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Could not delete project: ${error.message}`);
  if (!data) return undefined;

  const project = toProject(data as Row);

  // Best-effort cleanup. Seed art bundled in the repo is left alone.
  await Promise.all(project.images.map(deleteUpload));

  return project;
}
