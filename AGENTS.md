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
- **Public copy is edited in the dashboard, not in the code.** `src/lib/site.ts`
  holds *defaults*; the live values are those merged with the Supabase
  `site_content` row by `getSiteContentSafe()`. Components take a
  `content: SiteContent` prop — don't reintroduce a direct `site` import in a
  component, or that section stops being editable.
- **Every write goes through `validateProject`** in `src/lib/validate.ts`, which
  also rejects image URLs that aren't ours. The admin form is a convenience;
  the server is the gate.
- **Mutations must call `revalidatePublicPages()`** (`src/lib/revalidate.ts`),
  or the save succeeds and the cached public pages keep showing the old content
  until the revalidate window expires. This failure is silent — the dashboard
  looks like it worked.
- **Motion must degrade.** Anything animated checks `useReducedMotion`, and no
  content may depend on an animation to become visible.

## Checks

```bash
npm run build        # types, lint, prerender — needs Supabase env vars
npm run test:smoke   # end-to-end admin CRUD (needs a server on :3117)
```
