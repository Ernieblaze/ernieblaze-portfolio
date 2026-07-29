"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { ImageUploader } from "@/components/admin/image-uploader";
import type { Project } from "@/lib/types";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/25 transition-colors focus:border-accent/60 focus:outline-none";

const LABEL = "text-muted mb-2 block font-mono text-xs tracking-wider uppercase";

type FormState = {
  title: string;
  description: string;
  category: string;
  liveUrl: string;
  tech: string;
  problem: string;
  solution: string;
  result: string;
  images: string[];
  published: boolean;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  category: "Website",
  liveUrl: "",
  tech: "",
  problem: "",
  solution: "",
  result: "",
  images: [],
  published: true,
};

function fromProject(project: Project): FormState {
  return {
    title: project.title,
    description: project.description,
    category: project.category,
    liveUrl: project.liveUrl,
    tech: project.tech.join(", "),
    problem: project.caseStudy.problem,
    solution: project.caseStudy.solution,
    result: project.caseStudy.result,
    images: project.images,
    published: project.published,
  };
}

type ProjectFormProps = {
  /** Present when editing; omitted when adding. */
  project?: Project;
  onSaved: () => void;
  onCancel?: () => void;
};

export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps) {
  const [form, setForm] = useState<FormState>(
    project ? fromProject(project) : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      liveUrl: form.liveUrl,
      tech: form.tech,
      images: form.images,
      published: form.published,
      caseStudy: {
        problem: form.problem,
        solution: form.solution,
        result: form.result,
      },
    };

    try {
      const response = await fetch(
        project ? `/api/projects/${project.id}` : "/api/projects",
        {
          method: project ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Could not save the project.");
        return;
      }

      if (!project) setForm(EMPTY);
      onSaved();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className={LABEL}>
            Title
          </label>
          <input
            id="title"
            required
            maxLength={90}
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="Northwind Dental"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="category" className={LABEL}>
            Category
          </label>
          <input
            id="category"
            value={form.category}
            onChange={(event) => set("category", event.target.value)}
            placeholder="Redesign"
            list="category-suggestions"
            className={FIELD}
          />
          <datalist id="category-suggestions">
            {[
              "Website",
              "Landing Page",
              "Redesign",
              "E-commerce",
              "SaaS Website",
              "Web App",
            ].map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={LABEL}>
          Short description
        </label>
        <input
          id="description"
          required
          maxLength={200}
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
          placeholder="Redesign for a city-centre dental practice, built around one job: booking an appointment."
          className={FIELD}
        />
        <p className="text-muted/60 mt-1.5 font-mono text-[11px]">
          {form.description.length}/200 · shown on the card
        </p>
      </div>

      <div>
        <label htmlFor="liveUrl" className={LABEL}>
          Live URL
        </label>
        <input
          id="liveUrl"
          required
          inputMode="url"
          value={form.liveUrl}
          onChange={(event) => set("liveUrl", event.target.value)}
          placeholder="https://northwinddental.com"
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="tech" className={LABEL}>
          Tech stack
        </label>
        <input
          id="tech"
          value={form.tech}
          onChange={(event) => set("tech", event.target.value)}
          placeholder="Next.js, TypeScript, Tailwind CSS, Stripe"
          className={FIELD}
        />
        <p className="text-muted/60 mt-1.5 font-mono text-[11px]">
          Separate with commas
        </p>
      </div>

      <ImageUploader
        images={form.images}
        onChange={(images) => set("images", images)}
        onError={setError}
      />

      <fieldset className="space-y-5 rounded-2xl border border-white/10 p-5">
        <legend className="route-label px-2">Case study</legend>

        {(
          [
            ["problem", "The problem", "What was broken, and what it cost them."],
            ["solution", "What I built", "The approach, and why that approach."],
            ["result", "The result", "Numbers if you have them. Be specific."],
          ] as const
        ).map(([key, label, hint]) => (
          <div key={key}>
            <label htmlFor={key} className={LABEL}>
              {label}
            </label>
            <textarea
              id={key}
              rows={3}
              value={form[key]}
              onChange={(event) => set(key, event.target.value)}
              placeholder={hint}
              className={`${FIELD} resize-y`}
            />
          </div>
        ))}
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(event) => set("published", event.target.checked)}
          className="accent-accent mt-0.5 size-4"
        />
        <span>
          <span className="block text-sm font-medium">Show on the public site</span>
          <span className="text-muted mt-0.5 block text-sm">
            Uncheck to keep it as a draft only you can see.
          </span>
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="bg-accent inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium text-black transition-shadow duration-500 hover:shadow-[0_0_40px_-8px_#00f0ff] disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : project ? (
            "Save changes"
          ) : (
            "Add project"
          )}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-muted hover:text-white rounded-full border border-white/10 px-6 py-3 text-sm transition-colors"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
