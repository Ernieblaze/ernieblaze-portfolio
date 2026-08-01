"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";

import { BrowserFrame } from "@/components/browser-frame";
import type { Project } from "@/lib/types";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const CHAPTERS = [
  { key: "problem", label: "The problem" },
  { key: "solution", label: "What I built" },
  { key: "result", label: "The result" },
] as const;

export function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const open = Boolean(project);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Keep Tab inside the dialog.
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-70 overflow-y-auto overscroll-contain p-4 sm:p-8"
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            className="fixed inset-0 cursor-default bg-black/80 backdrop-blur-md"
            onClick={onClose}
            aria-label="Close case study"
            tabIndex={-1}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-study-title"
            className="relative mx-auto my-4 max-w-4xl rounded-2xl border border-line bg-ink-raised/95 shadow-[0_60px_160px_-60px_var(--glow-strong)] backdrop-blur-2xl sm:my-8"
            initial={reduceMotion ? undefined : { opacity: 0, y: 28, scale: 0.985 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 20, scale: 0.99 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-6 rounded-t-2xl border-b border-line bg-ink-raised/90 px-6 py-5 backdrop-blur-xl sm:px-8">
              <div className="min-w-0">
                <p className="route-label">{project.category}</p>
                <h2
                  id="case-study-title"
                  className="font-display mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl"
                >
                  {project.title}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="glass text-muted hover:text-accent inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors"
                aria-label="Close case study"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="px-6 pt-6 pb-8 sm:px-8 sm:pb-10">
              <p className="text-lg leading-relaxed text-fg/85">
                {project.description}
              </p>

              {/* Screenshots */}
              <div className="mt-8 space-y-5">
                {project.images.map((src, index) => (
                  <BrowserFrame
                    key={src}
                    compact
                    address={hostname(project.liveUrl)}
                  >
                    <div className="relative aspect-16/10">
                      <Image
                        src={src}
                        alt={`${project.title} screenshot ${index + 1} of ${project.images.length}`}
                        fill
                        sizes="(max-width: 896px) 100vw, 896px"
                        className="object-cover object-top"
                      />
                    </div>
                  </BrowserFrame>
                ))}
              </div>

              {/* Case study */}
              <div className="mt-10 space-y-8">
                {CHAPTERS.map(({ key, label }) =>
                  project.caseStudy[key] ? (
                    <div key={key} className="border-l border-line pl-5">
                      <h3 className="route-label">{label}</h3>
                      <p className="text-muted mt-3 leading-relaxed">
                        {project.caseStudy[key]}
                      </p>
                    </div>
                  ) : null,
                )}
              </div>

              {/* Tech */}
              <div className="mt-10">
                <h3 className="route-label">/stack</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.tech.map((item) => (
                    <li
                      key={item}
                      className="border-accent/25 text-accent/90 rounded-full border px-3.5 py-1.5 font-mono text-xs"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="bg-accent inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-medium text-on-accent transition-shadow duration-500 hover:shadow-[0_0_44px_-6px_var(--glow-strong)]"
                >
                  Visit {hostname(project.liveUrl)}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>

                <Link
                  href={`/work/${project.slug}`}
                  className="text-muted hover:border-accent/50 hover:text-accent inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 text-sm transition-colors"
                >
                  Open as a page
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
