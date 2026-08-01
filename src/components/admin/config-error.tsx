import { AlertCircle } from "lucide-react";

/**
 * Shown when the dashboard can't reach Supabase.
 *
 * The public site degrades quietly when the database is unavailable, but the
 * dashboard is where you come to fix things — so it names the likely cause and
 * the screen to fix it on, rather than failing blank.
 */
export function AdminConfigError({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-20">
      <div className="w-full max-w-lg">
        <span className="glass mx-auto flex size-14 items-center justify-center rounded-full text-amber-400">
          <AlertCircle className="size-6" aria-hidden="true" />
        </span>

        <h1 className="font-display mt-6 text-center text-3xl font-bold tracking-tight">
          Can&rsquo;t reach the database
        </h1>

        <p className="text-muted mt-4 text-center leading-relaxed">
          The dashboard is running, but it couldn&rsquo;t load your projects.
          Your site itself is fine — only this page needs the connection.
        </p>

        <div className="glass mt-8 rounded-2xl p-6">
          <p className="route-label">What went wrong</p>
          <p className="text-muted mt-3 font-mono text-xs leading-relaxed break-words">
            {message}
          </p>
        </div>

        <div className="glass mt-4 rounded-2xl p-6">
          <p className="route-label">How to fix it</p>
          <ol className="text-muted mt-4 space-y-3 text-sm leading-relaxed">
            <li>
              <span className="text-fg">1.</span> In Vercel, open your
              project &rarr; Settings &rarr; Environment Variables.
            </li>
            <li>
              <span className="text-fg">2.</span> Check{" "}
              <code className="text-accent font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="text-accent font-mono text-xs">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              both exist, with no trailing spaces.
            </li>
            <li>
              <span className="text-fg">3.</span> The second one must be the{" "}
              <span className="text-fg">secret</span> key (
              <code className="font-mono text-xs">sb_secret_…</code>), not the
              publishable one.
            </li>
            <li>
              <span className="text-fg">4.</span> Redeploy — Vercel only
              picks up new variables on a fresh build.
            </li>
          </ol>
        </div>

        <p className="text-muted/60 mt-6 text-center font-mono text-[11px]">
          Full instructions: SETUP.md in the repo
        </p>
      </div>
    </main>
  );
}
