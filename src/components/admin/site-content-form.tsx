"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Check, Loader2, Plus, Trash2 } from "lucide-react";

import { ImageUploader } from "@/components/admin/image-uploader";
import type { SiteContent } from "@/lib/types";

const FIELD =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-fg placeholder:text-muted/60 transition-colors focus:border-accent/60 focus:outline-none";

const LABEL = "text-muted mb-2 block font-mono text-xs tracking-wider uppercase";

const HINT = "text-muted/70 mt-1.5 text-xs leading-relaxed";

const SECTION = "rounded-2xl border border-line bg-surface/50 p-5 sm:p-6";

const SECTION_TITLE = "font-display text-lg font-bold";

/**
 * The copy editor.
 *
 * Lists (paragraphs, skills) are edited as one-per-line textareas rather than
 * rows of inputs: it is a faster way to reorder and reword a block of prose,
 * and the server splits on newlines either way. Structured lists — stats,
 * services, socials — keep real rows, because their fields are not
 * interchangeable.
 *
 * Every field is optional to the server: clearing one falls back to the default
 * in `src/lib/site.ts` rather than blanking that part of the site.
 */
export function SiteContentForm() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/admin/site");
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error ?? "Could not load content.");
        setContent(data.content as SiteContent);
      } catch (cause) {
        if (!cancelled) {
          setLoadError(cause instanceof Error ? cause.message : "Could not load.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Shallow field setter, so each input stays a one-liner. */
  function set<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content || saving) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/admin/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save.");

      // Render what the server actually stored, not what was typed — trimming
      // and length caps happen there, and the form should show the truth.
      setContent(data.content as SiteContent);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>{loadError}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <p className="text-muted flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading your content…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ------------------------------------------------------- details */}
      <section className={SECTION}>
        <h3 className={SECTION_TITLE}>Your details</h3>
        <p className={HINT}>
          Name and role appear in the header, footer and page titles. Email is
          where the contact button sends people.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="sc-name">
              Name
            </label>
            <input
              id="sc-name"
              className={FIELD}
              value={content.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="sc-role">
              Role
            </label>
            <input
              id="sc-role"
              className={FIELD}
              value={content.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Freelance web developer"
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="sc-email">
              Email
            </label>
            <input
              id="sc-email"
              type="email"
              className={FIELD}
              value={content.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="sc-location">
              Location
            </label>
            <input
              id="sc-location"
              className={FIELD}
              value={content.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Remote · working across UK & US hours"
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="sc-url">
              Site URL
            </label>
            <input
              id="sc-url"
              className={FIELD}
              value={content.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://ernieblaze.dev"
            />
            <p className={HINT}>
              Used for link previews and the sitemap. Must start with https://
            </p>
          </div>

          <div>
            <label className={LABEL} htmlFor="sc-domain">
              Domain label
            </label>
            <input
              id="sc-domain"
              className={FIELD}
              value={content.domain}
              onChange={(e) => set("domain", e.target.value)}
              placeholder="ernieblaze.dev"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- hero */}
      <section className={SECTION}>
        <h3 className={SECTION_TITLE}>Hero</h3>
        <p className={HINT}>The first thing anyone reads.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className={LABEL} htmlFor="sc-tagline">
              Headline
            </label>
            <textarea
              id="sc-tagline"
              rows={2}
              className={FIELD}
              value={content.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="sc-support">
              Supporting line
            </label>
            <textarea
              id="sc-support"
              rows={3}
              className={FIELD}
              value={content.heroSupport}
              onChange={(e) => set("heroSupport", e.target.value)}
            />
            <p className={HINT}>Two sentences works best. Three starts to sag.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="sc-avail-label">
                Availability badge
              </label>
              <input
                id="sc-avail-label"
                className={FIELD}
                value={content.availability.label}
                onChange={(e) =>
                  set("availability", {
                    ...content.availability,
                    label: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className={LABEL} htmlFor="sc-avail-detail">
                Availability detail
              </label>
              <input
                id="sc-avail-detail"
                className={FIELD}
                value={content.availability.detail}
                onChange={(e) =>
                  set("availability", {
                    ...content.availability,
                    detail: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="accent-accent size-4"
              checked={content.availability.open}
              onChange={(e) =>
                set("availability", {
                  ...content.availability,
                  open: e.target.checked,
                })
              }
            />
            Currently taking on work
          </label>
        </div>
      </section>

      {/* --------------------------------------------------------- stats */}
      <RowEditor
        title="Stats"
        hint="The three numbers under the hero. Keep values short — “5 yrs”, “30+”."
        rows={content.stats}
        onChange={(rows) => set("stats", rows)}
        blank={{ value: "", label: "" }}
        max={6}
        addLabel="Add stat"
        fields={[
          { key: "value", label: "Value", placeholder: "30+" },
          { key: "label", label: "Label", placeholder: "Sites shipped" },
        ]}
      />

      {/* --------------------------------------------------------- about */}
      <section className={SECTION}>
        <h3 className={SECTION_TITLE}>About</h3>

        <div className="mt-5 space-y-4">
          <div>
            <label className={LABEL} htmlFor="sc-about-heading">
              Heading
            </label>
            <textarea
              id="sc-about-heading"
              rows={2}
              className={FIELD}
              value={content.about.heading}
              onChange={(e) =>
                set("about", { ...content.about, heading: e.target.value })
              }
            />
          </div>

          <div>
            <label className={LABEL}>Your photo</label>
            <ImageUploader
              images={content.about.photo ? [content.about.photo] : []}
              onChange={(images) =>
                set("about", { ...content.about, photo: images[0] ?? null })
              }
              onError={setError}
              // No live URL to screenshot — this is a portrait, not a site.
              liveUrl=""
            />
            <p className={HINT}>
              Optional. Without one, the About section shows a placeholder.
            </p>
          </div>

          <div>
            <label className={LABEL} htmlFor="sc-about-alt">
              Photo description
            </label>
            <input
              id="sc-about-alt"
              className={FIELD}
              value={content.about.photoAlt}
              onChange={(e) =>
                set("about", { ...content.about, photoAlt: e.target.value })
              }
              placeholder="Ernie Blaze"
            />
            <p className={HINT}>Read aloud by screen readers in place of the image.</p>
          </div>

          <div>
            <label className={LABEL} htmlFor="sc-about-body">
              Your story
            </label>
            <textarea
              id="sc-about-body"
              rows={9}
              className={`${FIELD} leading-relaxed`}
              value={content.about.paragraphs.join("\n\n")}
              onChange={(e) =>
                set("about", {
                  ...content.about,
                  paragraphs: e.target.value.split(/\n\s*\n/),
                })
              }
            />
            <p className={HINT}>
              Leave a blank line between paragraphs. Up to eight.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- skills */}
      <section className={SECTION}>
        <h3 className={SECTION_TITLE}>Skills</h3>
        <p className={HINT}>One per line. Shown as the marquee in About.</p>
        <textarea
          rows={6}
          className={`${FIELD} mt-4 font-mono text-sm`}
          value={content.skills.join("\n")}
          onChange={(e) => set("skills", e.target.value.split("\n"))}
        />
      </section>

      {/* ------------------------------------------------------ services */}
      <section className={SECTION}>
        <h3 className={SECTION_TITLE}>Services</h3>
        <p className={HINT}>What you can be hired for.</p>

        <div className="mt-5 space-y-4">
          {content.services.map((service, index) => (
            <div key={index} className="rounded-xl border border-line-soft p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="route-label">Service {index + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "services",
                      content.services.filter((_, i) => i !== index),
                    )
                  }
                  className="text-muted hover:text-red-400 transition-colors"
                  aria-label={`Remove service ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  className={FIELD}
                  placeholder="Title"
                  value={service.title}
                  onChange={(e) => {
                    const next = [...content.services];
                    next[index] = { ...service, title: e.target.value };
                    set("services", next);
                  }}
                />
                <textarea
                  rows={3}
                  className={FIELD}
                  placeholder="What it is and who it's for"
                  value={service.description}
                  onChange={(e) => {
                    const next = [...content.services];
                    next[index] = { ...service, description: e.target.value };
                    set("services", next);
                  }}
                />
                <input
                  className={`${FIELD} font-mono text-sm`}
                  placeholder="Deliverables, comma separated"
                  value={service.deliverables.join(", ")}
                  onChange={(e) => {
                    const next = [...content.services];
                    next[index] = {
                      ...service,
                      deliverables: e.target.value.split(",").map((s) => s.trim()),
                    };
                    set("services", next);
                  }}
                />
              </div>
            </div>
          ))}

          {content.services.length < 10 && (
            <button
              type="button"
              onClick={() =>
                set("services", [
                  ...content.services,
                  { title: "", description: "", deliverables: [] },
                ])
              }
              className="text-muted hover:text-accent hover:border-accent/40 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-sm transition-colors"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add service
            </button>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------- socials */}
      <RowEditor
        title="Social links"
        hint="Name is used for the icon — X, GitHub, LinkedIn are recognised."
        rows={content.socials}
        onChange={(rows) => set("socials", rows)}
        blank={{ name: "", handle: "", href: "" }}
        max={8}
        addLabel="Add link"
        fields={[
          { key: "name", label: "Network", placeholder: "GitHub" },
          { key: "handle", label: "Handle", placeholder: "ernieblaze" },
          { key: "href", label: "URL", placeholder: "https://github.com/…" },
        ]}
      />

      {/* --------------------------------------------------------- save */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-ink/95 blur-surface sticky bottom-0 -mx-1 flex items-center gap-3 border-t border-line px-1 py-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-accent-vivid inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium text-on-accent transition-opacity disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {saving ? "Saving…" : "Save changes"}
        </button>

        {saved && (
          <span className="text-accent flex items-center gap-1.5 text-sm">
            <Check className="size-4" aria-hidden="true" />
            Saved — your site is updated
          </span>
        )}
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

type RowEditorProps<T extends Record<string, string>> = {
  title: string;
  hint: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  blank: T;
  max: number;
  addLabel: string;
  fields: { key: keyof T & string; label: string; placeholder: string }[];
};

/**
 * A repeating list of short fields — stats, socials.
 *
 * Generic because those two are the same interaction with different columns,
 * and a second near-identical block is how the two quietly drift apart.
 */
function RowEditor<T extends Record<string, string>>({
  title,
  hint,
  rows,
  onChange,
  blank,
  max,
  addLabel,
  fields,
}: RowEditorProps<T>) {
  return (
    <section className={SECTION}>
      <h3 className={SECTION_TITLE}>{title}</h3>
      <p className={HINT}>{hint}</p>

      <div className="mt-5 space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="grid flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="text-muted/70 mb-1 block font-mono text-[10px] tracking-wider uppercase">
                    {field.label}
                  </label>
                  <input
                    className={FIELD}
                    placeholder={field.placeholder}
                    value={row[field.key] ?? ""}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...row, [field.key]: e.target.value };
                      onChange(next);
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="text-muted hover:text-red-400 mb-3 shrink-0 transition-colors"
              aria-label={`Remove ${title.toLowerCase()} row ${index + 1}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        {rows.length < max && (
          <button
            type="button"
            onClick={() => onChange([...rows, { ...blank }])}
            className="text-muted hover:text-accent hover:border-accent/40 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-sm transition-colors"
          >
            <Plus className="size-4" aria-hidden="true" />
            {addLabel}
          </button>
        )}
      </div>
    </section>
  );
}
