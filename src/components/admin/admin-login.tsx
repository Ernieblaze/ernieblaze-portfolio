"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/lib/site";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => ({}));
    setError(data.error ?? "Sign-in failed. Try again.");
    setBusy(false);
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-5 py-20">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="glass text-accent mx-auto flex size-14 items-center justify-center rounded-full">
            <Lock className="size-5" aria-hidden="true" />
          </span>
          <h1 className="font-display mt-6 text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted mt-2 font-mono text-xs tracking-wider uppercase">
            {site.domain}/admin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6">
          <label
            htmlFor="password"
            className="text-muted mb-2 block font-mono text-xs tracking-wider uppercase"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "password-error" : undefined}
            className="focus:border-accent/60 w-full rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors focus:outline-none"
          />

          {error ? (
            <p id="password-error" role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="bg-accent-vivid mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-medium text-on-accent transition-shadow duration-500 hover:shadow-[0_0_40px_-8px_var(--glow-strong)] disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Checking
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-muted/60 mt-6 text-center font-mono text-[11px] leading-relaxed">
          Set ADMIN_PASSWORD in .env.local to change this.
        </p>
      </div>
    </main>
  );
}
