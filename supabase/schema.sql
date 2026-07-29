-- ernieblaze.dev — database schema
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run; every statement is idempotent.

-- ---------------------------------------------------------------- projects

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text not null,
  category    text not null default 'Website',
  live_url    text not null,
  tech        text[] not null default '{}',
  images      text[] not null default '{}',
  case_study  jsonb not null default '{"problem":"","solution":"","result":""}'::jsonb,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- The public site lists published projects newest-first on every request.
create index if not exists projects_published_created_at_idx
  on public.projects (published, created_at desc);

-- ------------------------------------------------------------------- RLS
--
-- The app reaches Postgres with the service-role key, which bypasses RLS
-- entirely. These policies exist so that if the anon key is ever used from a
-- browser, the worst it can do is read work that is already public.

alter table public.projects enable row level security;

drop policy if exists "published projects are readable" on public.projects;
create policy "published projects are readable"
  on public.projects
  for select
  to anon, authenticated
  using (published = true);

-- No insert/update/delete policies: writes are server-only, through the
-- service-role key.

-- --------------------------------------------------------------- storage
--
-- Public-read bucket for project screenshots. Uploads and deletes happen
-- server-side with the service-role key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  6291456, -- 6 MB, matching MAX_BYTES in src/lib/uploads.ts
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project images are readable" on storage.objects;
create policy "project images are readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'project-images');
