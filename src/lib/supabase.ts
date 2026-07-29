import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client.
 *
 * Uses the service-role key, which bypasses row-level security — so this
 * module must never be imported into a client component. Every caller
 * (`src/lib/projects.ts`, `src/lib/uploads.ts`) runs on the server only, and
 * the `server-only` import above turns a mistake into a build error rather
 * than a leaked key.
 */

export const PROJECTS_TABLE = "projects";
export const IMAGE_BUCKET = "project-images";

let client: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill in your Supabase credentials — see README "Supabase setup".`,
    );
  }
  return value;
}

export function supabase(): SupabaseClient {
  if (client) return client;

  client = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  return client;
}

/** The origin images are served from, e.g. `abcxyz.supabase.co`. */
export function storageHostname(): string {
  return new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL")).hostname;
}
