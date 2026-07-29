# Working in this repo

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion.
Deployed on Vercel, data in Supabase (Postgres + Storage).

## Things that are easy to get wrong here

- **Never write to the filesystem at runtime.** Vercel's filesystem is
  ephemeral and per-instance. Project records go to Supabase Postgres
  (`src/lib/projects.ts`), images to Supabase Storage (`src/lib/uploads.ts`).
  `public/seed` is fine — that art ships with the repo.
- **`SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security.** It is
  server-only. `src/lib/supabase.ts` imports `server-only` so a client-side
  import becomes a build error; keep it that way, and never rename it to
  `NEXT_PUBLIC_*`.
- **Tailwind v4 has no `tailwind.config.js`.** Theme tokens, custom utilities
  (`glass`, `grid-field`, `route-label`) and keyframes are all declared in
  `src/app/globals.css`.
- **All public copy lives in `src/lib/site.ts`.** Change content there, not in
  components.
- **Every write goes through `validateProject`** in `src/lib/validate.ts`, which
  also rejects image URLs that aren't ours. The admin form is a convenience;
  the server is the gate.
- **Mutations must call `revalidatePath`**, or new work won't appear on the
  cached public pages.
- **Motion must degrade.** Anything animated checks `useReducedMotion`, and no
  content may depend on an animation to become visible.

## Checks

```bash
npm run build        # types, lint, prerender — needs Supabase env vars
npm run test:smoke   # end-to-end admin CRUD (needs a server on :3117)
```
