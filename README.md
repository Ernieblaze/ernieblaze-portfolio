# ernieblaze.dev

Personal portfolio and private project dashboard for Ernie Blaze.

Public site at `/`, dashboard at `/admin`. Projects added through the dashboard
appear on the public site immediately — same data source, no rebuild.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer
Motion · lucide-react · Supabase (Postgres + Storage) · Vercel.

---

## Run it

You need a Supabase project first — see [Supabase setup](#supabase-setup) below.

```bash
npm install
cp .env.example .env.local   # then fill in all four values
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

The build reads projects from Supabase, so the env vars must be set for
`npm run build` to succeed. It fails with a named error if any are missing.

---

## Supabase setup

Do this once, before the first run.

**1. Create the project.** [supabase.com/dashboard](https://supabase.com/dashboard)
→ New project. Any region near your visitors.

**2. Create the tables and bucket.** SQL Editor → New query → paste all of
`supabase/schema.sql` → Run. It creates the `projects` table, its indexes, the
`project-images` storage bucket, and read-only RLS policies. It's idempotent, so
re-running is safe.

**3. Copy the credentials.** Project Settings → API:

| Dashboard field | `.env.local` variable |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `service_role` secret | `SUPABASE_SERVICE_ROLE_KEY` |

> **The service-role key bypasses row-level security.** It is server-only —
> never prefix it with `NEXT_PUBLIC_`, never use it in a client component, and
> rotate it immediately if it's ever committed or pasted somewhere public.
> `src/lib/supabase.ts` imports `server-only` so a mistake becomes a build
> error.

**4. Load the placeholder projects** (optional — skip if you're going straight
to real work):

```bash
node --env-file=.env.local scripts/seed-supabase.mjs
```

This uploads the art in `public/seed` to the bucket and inserts the four
projects from `data/projects.json`. Re-running updates them in place; add
`--reset` to clear the table first.

---

## Add a project

1. Go to `/admin` and sign in.
2. Click **Add project**.
3. Fill in:
   - **Title** — the project name.
   - **Category** — "Landing Page", "Redesign", "E-commerce"… shown as the
     card's eyebrow label.
   - **Short description** — one line for the card, under 200 characters.
   - **Live URL** — must be reachable. It appears in the browser-chrome address
     bar on the card and powers the "Live preview" button. `https://` is added
     if you leave it off.
   - **Tech stack** — comma separated.
   - **Screenshots** — 1 to 3 images. **The first one is the card image**, so
     lead with the homepage. Aim for a 16:10 crop, around 1600×1000.
   - **Case study** — problem, what you built, result. Optional, but the result
     field is what wins the next client. Use numbers.
   - **Show on the public site** — uncheck to save it as a draft only you see.
4. Click **Add project**. It's live.

Edit and delete work the same way from the list below the form. Deleting a
project also deletes its uploaded screenshots.

### Where the data lives

| What | Where |
| --- | --- |
| Project records | Supabase → `public.projects` |
| Uploaded screenshots | Supabase Storage → `project-images` bucket |
| Placeholder seed data | `data/projects.json` + `public/seed/` (repo only) |

`data/projects.json` is the *seed* for `scripts/seed-supabase.mjs`, not the live
store. Once the site is running, Supabase is the source of truth and editing
that JSON file changes nothing.

> **Why not the filesystem?** Vercel's filesystem is ephemeral and
> per-instance: anything written at runtime vanishes on the next deploy and
> doesn't exist for other serverless instances in the meantime. Nothing in this
> app writes to disk.

---

## Change the admin password

The password is read from `ADMIN_PASSWORD`, falling back to `ernieblaze2026` if
it isn't set.

```bash
# .env.local
ADMIN_PASSWORD=something-only-you-know
ADMIN_SESSION_SECRET=<64 hex characters>
```

Generate the session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`ADMIN_SESSION_SECRET` signs the session cookie. Set it in production — without
it the signing key is derived from the password, so changing the password logs
out every open session. Restart the server after editing `.env.local`.

Auth is one shared password exchanged for a signed, httpOnly, 12-hour cookie.
Good enough for one person guarding their own portfolio. See "Going to
production" before putting anything sensitive behind it.

---

## Make it yours

Almost all copy lives in **`src/lib/site.ts`** — name, tagline, bio, skills,
stats, services, social links, email. Edit that file; no component changes
needed.

- **Photo:** drop a portrait at `public/ernie.jpg`, then set
  `about.photo: "/ernie.jpg"` in `src/lib/site.ts`. Until then the About section
  shows a labelled placeholder.
- **Social links:** the handles in `site.socials` are placeholders
  (`@ernieblaze` and friends). Replace them with real profiles.
- **Domain:** `site.url` feeds canonical URLs, the sitemap, and Open Graph tags.
- **Seed projects:** the four in `data/projects.json` use `.example.com` URLs and
  the art in `public/seed`. Delete them once real work is up.

### Design system

Tailwind v4 has no `tailwind.config.js`. Everything is declared in
`src/app/globals.css`:

| Token | Value |
| --- | --- |
| Background | `#050505` (`bg-ink`) |
| Surface | `.glass` — `bg-white/5` + `backdrop-blur-xl` + `border-white/10` |
| Accent | `#00f0ff` (`text-accent`, `bg-accent`) |
| Text | `#ffffff` / `#a1a1aa` (`text-muted`) |
| Display | Space Grotesk (`font-display`) |
| Body | Inter (`font-sans`) |
| Mono | JetBrains Mono (`font-mono`) |

Custom utilities: `.glass`, `.grid-field`, `.route-label`.

The signature device is **browser chrome**. `BrowserFrame` wraps the hero
showcase, every project card, and every case study image, so work is always
shown the way a client first sees it: in a browser, at a real address. The hero
types each project's URL into that address bar as it cycles.

Every animation checks `prefers-reduced-motion`, and no content depends on an
animation to become visible.

---

## Checks

```bash
npm run build         # types, lint, prerender
npm run test:smoke    # end-to-end admin flow, needs a server on :3117
npm run screenshots   # writes ./shots for a visual pass
```

`test:smoke` signs in, creates a project with an upload, checks it reaches the
public site, edits it, checks that `javascript:` URLs and unauthenticated writes
are rejected, then deletes it. Run it against a build:

```bash
npm run build
npx next start -p 3117 &
npm run test:smoke
```

Both scripts need `playwright` (already a devDependency) plus
`npx playwright install chromium`.

---

## Deploy to Vercel

1. Push to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo. Framework preset,
   build command, and output directory are all detected; leave them alone.
3. Add four environment variables (Settings → Environment Variables), for
   **Production, Preview, and Development**:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` secret |
   | `ADMIN_PASSWORD` | your dashboard password |
   | `ADMIN_SESSION_SECRET` | 64 hex characters |

   The build reads projects from Supabase, so it fails without the first two.
4. Deploy. Then add `ernieblaze.dev` under Settings → Domains and point your
   registrar's nameservers or A/CNAME records at Vercel.
5. Set `site.url` in `src/lib/site.ts` to the final domain — it feeds canonical
   URLs, the sitemap, and Open Graph tags.

Every push to `main` redeploys. Pull requests get preview URLs, which share the
same Supabase project unless you point previews at a second one.

### Caching

Public pages are statically rendered and revalidated on demand: saving in the
dashboard calls `revalidatePath`, so new work appears immediately without a
rebuild. Project pages not yet generated are rendered on first request.

---

## Still to harden

**Auth.** One shared password is fine for a solo portfolio behind a URL nobody
knows. If the dashboard ever holds anything worth stealing, move to
[Auth.js](https://authjs.dev) or Clerk, and add rate limiting to
`/api/admin/session` — right now nothing slows down a password guess.

**Contact form.** It currently opens the visitor's mail client via `mailto:`
(see the comment in `src/components/contact.tsx`). For a real inbox, add an
`/api/contact` route posting through [Resend](https://resend.com) or Postmark,
and add a honeypot field plus rate limiting at the same time — a public form
with an email behind it will get scraped.

### Already handled

- Open Graph and Twitter cards, including a generated OG image at
  `/opengraph-image` and per-project cards using the project's own screenshot.
- `robots.txt` and `sitemap.xml`, with `/admin` and `/api/` excluded.
- `Person` structured data on the homepage.
- Security headers in `next.config.ts`; `X-Powered-By` removed.
- Uploads restricted to raster images (no SVG — it can carry scripts), 6 MB
  each, with server-generated object keys. Enforced twice: in the app, and by
  the bucket's own `allowed_mime_types` and `file_size_limit`.
- Project writes validated server-side. `javascript:` and other non-http URLs
  rejected; image URLs must point at our own bucket or the bundled seed art.
- Row-level security on, with read-only policies for the anon key. Writes only
  happen server-side through the service-role key.
- Deleting or editing a project removes its now-orphaned images from the bucket.
