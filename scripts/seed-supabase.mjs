/**
 * Loads the placeholder projects in data/projects.json into Supabase, and
 * uploads their artwork from public/seed into the storage bucket.
 *
 * Run once after applying supabase/schema.sql:
 *
 *   node --env-file=.env.local scripts/seed-supabase.mjs
 *
 * Idempotent: re-running updates the existing rows by slug rather than
 * creating duplicates. Pass --reset to delete every project first.
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = "project-images";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/seed-supabase.mjs",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Uploads a file from public/seed and returns its public URL. */
async function uploadSeedImage(src) {
  const filename = path.basename(src);
  const extension = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[extension];

  if (!contentType) throw new Error(`Unsupported seed image: ${src}`);

  const body = await readFile(path.join("public", "seed", filename));

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`seed/${filename}`, body, {
      contentType,
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) throw new Error(`Upload failed for ${filename}: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`seed/${filename}`);
  return data.publicUrl;
}

const projects = JSON.parse(await readFile("data/projects.json", "utf8"));

if (process.argv.includes("--reset")) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(`Reset failed: ${error.message}`);
  console.log("Cleared existing projects.");
}

for (const project of projects) {
  const images = [];
  for (const src of project.images) {
    images.push(await uploadSeedImage(src));
  }

  const { error } = await supabase.from("projects").upsert(
    {
      slug: project.slug,
      title: project.title,
      description: project.description,
      category: project.category,
      live_url: project.liveUrl,
      tech: project.tech,
      images,
      case_study: project.caseStudy,
      published: project.published,
      created_at: project.createdAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug" },
  );

  if (error) throw new Error(`Insert failed for ${project.slug}: ${error.message}`);
  console.log(`seeded  ${project.slug}  (${images.length} images)`);
}

console.log(`\nDone — ${projects.length} projects in Supabase.`);
