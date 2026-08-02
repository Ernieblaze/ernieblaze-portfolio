# ernieblaze.dev

Personal portfolio and private project dashboard for Ernie Blaze.

Public site at `/`, dashboard at `/admin`. Projects added through the dashboard
appear on the public site immediately — same data source, no rebuild.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer
Motion · lucide-react · Supabase (Postgres + Storage) · Vercel.

> **Setting this up for the first time? Read [SETUP.md](SETUP.md) instead.**
> It's a step-by-step checklist that names the exact screen for every step.
> This README is the reference for how the code works.

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
`supabase/schema.sql` → Run. It creates the `projects` and `site_content`
tables, their indexes, the `project-images` storage bucket, and read-only RLS
policies. It's idempotent, so re-running is safe — and you must re-run it after
pulling a change that adds a table.

**3. Copy the credentials.** Project Settings → API Keys:

| Dashboard field | `.env.local` variable |
| --- | --- |
| Project URL (Settings → General) | `NEXT_PUBLIC_SUPABASE_URL` |
| **Secret keys** → `default` (`sb_secret_…`) | `SUPABASE_SERVICE_ROLE_KEY` |

Older projects show a **Legacy anon, service_role** tab instead — use the
`service_role` key there (`eyJhbGci…`). Both formats work and both grant the
same privileges.

Do **not** use the publishable / `anon` key. It's read-only, so the public site
would render but every dashboard save would fail.

> **This key bypasses row-level security.** It is server-only — never prefix it
> with `NEXT_PUBLIC_`, never use it in a client component, and rotate it
> immediately if it's ever committed or pasted somewhere public.
> `src/lib/supabase.ts` imports `server-only`, so a client-side import becomes
> a build error rather than a leaked key.

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
     lead with the homepage.

     Easiest route: fill in the Live URL, then click **Capture screenshot from
     the live URL**. The server renders the site and stores the image in your
     bucket — no manual screenshotting. Upload your own instead when you want a
     tighter crop, or for a page a screenshot service can't reach (behind a
     login, staging, heavy client-side rendering). Aim for a 16:10 crop, around
     1600×1000.
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
| Site copy | Supabase → `public.site_content` (one JSON row) |
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

> **Set it in every environment.** That fallback is written here, in a public
> repo, so anywhere `ADMIN_PASSWORD` is missing the dashboard password is
> effectively published. It exists for a first local run, not for anything
> reachable from the internet.

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

**Edit your copy at `/admin` → Site content.** Name, role, email, location,
hero headline, availability badge, stats, the whole About section, skills,
services and social links — all editable from the dashboard, no deploy needed.
Saving calls `revalidatePublicPages()`, so changes are live immediately.

`src/lib/site.ts` holds the **defaults** behind that. They are what a fresh
install starts with, and what renders for any field the dashboard hasn't set —
so a cleared field falls back to sensible copy rather than blanking a section.
Editing the file changes the fallback, not the running site.

Under the hood: a single `site_content` row in Supabase holding JSON, merged
over the defaults by `getSiteContentSafe()`. JSON rather than a column per
field, because copy changes shape and a migration per wording change is a tax
nobody pays twice — validation lives in `validateSiteContent` instead.

- **Photo:** upload it under Site content → About. Until you do, the About
  section shows a labelled placeholder.
- **Social links:** the defaults are placeholders (`@ernieblaze` and friends).
  Replace them under Site content → Social links. Unrecognised network names
  get a generic link icon rather than disappearing.
- **Domain:** the site URL feeds canonical URLs, the sitemap, and Open Graph
  tags. It is under Site content → Your details.
- **Seed projects:** the four in `data/projects.json` use `.example.com` URLs and
  the art in `public/seed`. Delete them once real work is up.

### Design system

Tailwind v4 has no `tailwind.config.js`. Everything is declared in
`src/app/globals.css`.

There are **two palettes and one set of tokens**. Components reference the
semantic name, never a raw colour, so the theme is swapped by changing values in
one file — and there is no `dark:` variant anywhere in the markup.

| Token | Dark | Light |
| --- | --- | --- |
| Background (`bg-ink`) | `#050505` | `#f4f7f9` |
| Raised (`bg-ink-raised`) | `#0e0e11` | `#ffffff` |
| Text (`text-fg`) | `#ffffff` | `#071216` |
| Muted (`text-muted`) | `#a1a1aa` | `#52666e` |
| Accent (`text-accent`) | `#00f0ff` | `#0b7285` |
| On accent (`text-on-accent`) | `#04161a` | `#ffffff` |

Type is the same in both: Space Grotesk (`font-display`), Inter (`font-sans`),
JetBrains Mono (`font-mono`).

Custom utilities: `.glass`, `.lift`, `.grid-field`, `.route-label`,
`.glow-hover`, `.glow-card`.

The theme is resolved **before first paint** by a small inline script
(`src/lib/theme.ts`, injected in `src/app/layout.tsx`), which is what stops the
page flashing the wrong palette on load. No stored choice means the device
preference wins, and keeps winning until the visitor picks explicitly with the
header toggle.

### Section navigation

`scroll-padding-top` on `html` is the **single** source of truth for where an
anchor lands. Do not also add `scroll-mt-*` to a section — the two stack, and
every jump lands twice as far down as intended. The header additionally
intercepts nav clicks (`goToSection` in `src/components/site-header.tsx`) so the
mobile menu closes and releases its scroll lock *before* the scroll runs;
without that ordering the browser is asked to scroll a locked body and the jump
is silently swallowed. `nav-test.mjs` measures all of this.

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
npm run test:nav      # anchor navigation, desktop + mobile; BASE=<url>
npm run test:theme    # light/dark: device preference, toggle, no flash
npm run screenshots   # writes ./shots for a visual pass
```

`test:nav` clicks every nav link at both breakpoints and prints where each
section lands relative to the viewport top. All eight should report
`sectionTop: 88` — matching `scroll-padding-top`. Anything else means the double
offset described under [Section navigation](#section-navigation) is back.

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
rebuild. Project pages not yet generated are rendered on first request and
cached from then on.

The build itself never needs the database. `getPublishedProjectsSafe` returns an
empty list instead of throwing, and `/work/[slug]` declares an empty
`generateStaticParams`, so a missing key or an unreachable Supabase produces a
site with no projects rather than a failed deploy. That guarantee is why these
pages do **not** need `force-dynamic` — which only moved the database round trip
onto every visitor.

### Region

Supabase is in Frankfurt, so Vercel's **Function Region must be `fra1`**
(Settings → Functions). Left on the Washington DC default, every uncached render
crosses the Atlantic twice before it can return a page.

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
