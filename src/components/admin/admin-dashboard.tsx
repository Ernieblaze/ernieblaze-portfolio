"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ExternalLink,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { ProjectForm } from "@/components/admin/project-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/lib/site";
import type { Project } from "@/lib/types";

type Panel =
  | { mode: "closed" }
  | { mode: "new" }
  | { mode: "edit"; project: Project };

export function AdminDashboard({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>({ mode: "closed" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(
      `Delete "${project.title}"? Its uploaded screenshots are removed too. This can't be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(project.id);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  async function handleSignOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.refresh();
  }

  function handleSaved() {
    setPanel({ mode: "closed" });
    router.refresh();
  }

  const publishedCount = projects.filter((project) => project.published).length;

  return (
    <div className="min-h-dvh">
      {/* Bar */}
      <header className="blur-surface sticky top-0 z-40 border-b border-line bg-ink/92">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg font-bold tracking-tight">
              {site.name}
            </span>
            <span className="text-accent/70 font-mono text-xs">/admin</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link
              href="/"
              className="text-muted hover:text-accent hidden items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm transition-colors sm:inline-flex"
            >
              View site
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-muted hover:text-accent inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm transition-colors"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Projects
            </h1>
            <p className="text-muted mt-2">
              {projects.length} total · {publishedCount} live on the site
            </p>
          </div>

          {panel.mode === "closed" ? (
            <button
              type="button"
              onClick={() => setPanel({ mode: "new" })}
              className="bg-accent inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium text-on-accent transition-shadow duration-500 hover:shadow-[0_0_40px_-8px_var(--glow-strong)]"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add project
            </button>
          ) : null}
        </div>

        {/* Editor */}
        {panel.mode !== "closed" ? (
          <section className="glass mt-10 rounded-2xl p-6 sm:p-8">
            <h2 className="font-display mb-6 text-2xl font-bold tracking-tight">
              {panel.mode === "edit"
                ? `Editing ${panel.project.title}`
                : "New project"}
            </h2>
            <ProjectForm
              key={panel.mode === "edit" ? panel.project.id : "new"}
              project={panel.mode === "edit" ? panel.project : undefined}
              onSaved={handleSaved}
              onCancel={() => setPanel({ mode: "closed" })}
            />
          </section>
        ) : null}

        {/* List */}
        <ul className="mt-10 space-y-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="hover:border-accent/25 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 transition-colors sm:flex-row sm:items-center"
            >
              <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-xl border border-line sm:w-40">
                <Image
                  src={project.images[0]}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover object-top"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display truncate text-lg font-bold tracking-tight">
                    {project.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ${
                      project.published
                        ? "bg-accent/15 text-accent"
                        : "text-muted bg-line"
                    }`}
                  >
                    {project.published ? "Live" : "Draft"}
                  </span>
                </div>

                <p className="text-muted mt-1.5 line-clamp-2 text-sm">
                  {project.description}
                </p>

                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-muted hover:text-accent mt-2 inline-flex items-center gap-1 font-mono text-[11px] transition-colors"
                >
                  {project.liveUrl}
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </a>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPanel({ mode: "edit", project });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-muted hover:border-accent/50 hover:text-accent inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm transition-colors"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit
                  <span className="sr-only"> {project.title}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(project)}
                  disabled={deletingId === project.id}
                  className="text-muted inline-flex items-center justify-center rounded-full border border-line p-2.5 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                  aria-label={`Delete ${project.title}`}
                >
                  {deletingId === project.id ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {projects.length === 0 && panel.mode === "closed" ? (
          <div className="glass mt-10 rounded-2xl px-6 py-16 text-center">
            <p className="text-muted">
              No projects yet. Add your first one and it appears on the site
              straight away.
            </p>
            <button
              type="button"
              onClick={() => setPanel({ mode: "new" })}
              className="bg-accent mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium text-on-accent"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add project
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
