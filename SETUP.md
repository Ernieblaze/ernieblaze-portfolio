# Setup checklist

Follow this top to bottom. Each step says **exactly** which screen you should be
looking at, and what "done" looks like.

Nothing here can break the site — the app is built so that a missing setting
shows a clear message instead of failing.

---

## Where each piece lives

Three services, three jobs. Worth understanding once, because it makes the rest
obvious:

| Service | Its job | What breaks without it |
| --- | --- | --- |
| **GitHub** | Stores the code | Vercel has nothing to deploy |
| **Vercel** | Runs the website | No live site |
| **Supabase** | Stores projects + images | Site loads, but Work section is empty and the dashboard can't save |

The flow: you push code to **GitHub** → **Vercel** builds and hosts it →
the running site reads and writes **Supabase**.

---

## ✅ Step 1 — GitHub (done)

Repo: [github.com/Ernieblaze/ernieblaze-portfolio](https://github.com/Ernieblaze/ernieblaze-portfolio)

Every push to `main` automatically redeploys Vercel. You don't need to touch
GitHub again unless you're changing code.

---

## ✅ Step 2 — Supabase project (done)

- Project: `ernieblaze-portfolio`
- URL: `https://ltsrjrwzvgzguuorvzby.supabase.co`
- Region: Central EU (Frankfurt)
- Schema: applied ("Success. No rows returned.")

---

## Step 3 — Clean up the duplicate Vercel projects

**Why:** every visit to `vercel.com/new` created a *new* project. You likely
have two or three, all with failed deploys. Extra projects don't cost anything,
but you need to know which one is real — otherwise you'll add settings to the
wrong one and wonder why nothing changed.

**Screen:** [vercel.com/dashboard](https://vercel.com/dashboard)

1. You'll see cards like `ernieblaze-portfolio`, `ernieblaze-portfolio-xjgd`.
2. **Keep the one named exactly `ernieblaze-portfolio`.** That's the real one.
3. For each *other* one: click it → **Settings** → scroll to the very bottom →
   **Delete Project** → type the name to confirm.

**Done looks like:** exactly one project called `ernieblaze-portfolio` on your
dashboard.

> From here on, **never use `vercel.com/new` again.** Always start from
> [vercel.com/dashboard](https://vercel.com/dashboard) and click into your
> project.

---

## Step 4 — Add the four settings in Vercel

**Why:** these are the passwords and addresses the site needs. They're kept out
of the code on purpose, so your public GitHub repo contains no secrets.

**Screen:** Vercel dashboard → click **`ernieblaze-portfolio`** →
**Settings** tab (top) → **Environment Variables** (left sidebar)

Add these one at a time. For each: type the Key, paste the Value, make sure
**all three** of Production / Preview / Development are ticked, then **Save**.

### 1 of 4
```
Key:    NEXT_PUBLIC_SUPABASE_URL
Value:  https://ltsrjrwzvgzguuorvzby.supabase.co
```

### 2 of 4
```
Key:    SUPABASE_SERVICE_ROLE_KEY
Value:  sb_secret_...
```
Get it from Supabase → **Settings** → **API Keys** → **Secret keys** →
`default` → click the 👁 to reveal → copy.

⚠️ Use the **Secret** key, not the Publishable one. The publishable key is
read-only, so the site would load but every dashboard save would fail.

### 3 of 4
```
Key:    ADMIN_PASSWORD
Value:  <invent a password now — write it down>
```
⚠️ **Do not use `ernieblaze2026`.** Your GitHub repo is public, and that default
is written in the README, so anyone could read it and sign into your dashboard.

### 4 of 4
```
Key:    ADMIN_SESSION_SECRET
Value:  69c4b8b01dae939f07e7bf1ebdbbc8a91624392fdaacf20c8646594d519c364b
```
This one just signs your login cookie. It doesn't need to be memorable.

**Watch out for:** a trailing space or line break when pasting. That's the most
common cause of "I set it but it still doesn't work."

**Done looks like:** four rows listed on the Environment Variables page.

---

## Step 5 — Redeploy

**Why:** Vercel doesn't automatically rebuild when you change settings. You have
to tell it to.

**Screen:** your project → **Deployments** tab

1. Find the most recent deployment at the top.
2. Click the **⋯** menu on its right.
3. Click **Redeploy** → confirm.

Takes about 90 seconds.

**Done looks like:** a green ● **Ready** next to the deployment, and clicking
**Visit** opens your portfolio.

If it's red, open **Build Logs** and send me the red lines. The error messages
are written to say exactly which setting is missing.

---

## Step 6 — Put the site next to the database

**Why:** your Supabase database is in Frankfurt. By default Vercel runs your
site in Washington DC. Every page load would cross the Atlantic twice to fetch
your projects — noticeably slow for no reason.

**Screen:** your project → **Settings** → **Functions**

Set **Function Region** to **Frankfurt, Germany (fra1)** → Save.

Then redeploy once more (Step 5) for it to take effect.

---

## Step 7 — Add your first project

**Screen:** `https://<your-site>.vercel.app/admin`

1. Sign in with the `ADMIN_PASSWORD` you invented in Step 4.
2. Click **Add project**.
3. Fill it in and click **Add project**.
4. Open your homepage — it's there immediately. No redeploy needed.

That last point is the whole idea: **code changes need a deploy, content changes
don't.**

---

## Step 8 — Your domain

**Screen:** your project → **Settings** → **Domains**

1. Type `ernieblaze.dev` → **Add**.
2. Vercel shows you DNS records to create.
3. Add those at whoever you bought the domain from (Namecheap, GoDaddy, etc).
4. Wait — DNS can take anywhere from 10 minutes to a few hours.

Then tell me, and I'll update `site.url` in the code so your link previews and
sitemap point at the real domain.

---

## Running it on your own machine (optional)

You don't need this to have a live site. It's for when you want to change code
and see it before pushing.

```bash
cd "C:\Users\Ernie Blaze\ernieblaze-portfolio"
copy .env.example .env.local
```

Open `.env.local` and paste in the same four values from Step 4. Then:

```bash
npm run dev
```

Open http://localhost:3000.

> `.env.local` is gitignored, so your secrets never reach GitHub.

---

## If something goes wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build fails, `Missing NEXT_PUBLIC_SUPABASE_URL` | Env var absent or misspelled | Step 4, then Step 5 |
| Site loads, Work section empty | No projects in the database yet | Step 7 |
| Dashboard says "That password doesn't match" | `ADMIN_PASSWORD` differs from what you typed | Check Step 4 for trailing spaces |
| Dashboard saves fail | Using the Publishable key, not the Secret one | Step 4, item 2 |
| Changed a setting, nothing happened | Vercel didn't rebuild | Step 5 |
| Images don't appear after upload | Schema not applied | Re-run `supabase/schema.sql` |

Whatever the symptom: send me the red lines from **Build Logs**, or the exact
message on screen. Don't guess — the error messages are written to name the
cause.
