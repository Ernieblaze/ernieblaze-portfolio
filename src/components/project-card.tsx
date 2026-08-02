"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { BrowserFrame } from "@/components/browser-frame";
import type { Project } from "@/lib/types";

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type ProjectCardProps = {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
};

export function ProjectCard({ project, index, onOpen }: ProjectCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.article
      id={project.slug}
      className="group hover:border-accent/30 lift relative rounded-2xl border border-line bg-surface p-3 transition-colors duration-500 hover:shadow-[0_28px_80px_-40px_var(--glow-strong)] sm:p-4"
      initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.65,
        delay: Math.min(index, 3) * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduceMotion ? undefined : { y: -6 }}
    >
      <BrowserFrame compact address={hostname(project.liveUrl)}>
        <div className="relative aspect-16/10 overflow-hidden">
          <Image
            src={project.images[0]}
            alt={`${project.title} — ${project.category}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 42vw"
            className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transform-none"
          />
          {/* Keeps the caption legible over light screenshots */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
      </BrowserFrame>

      <div className="px-2 pt-6 pb-2 sm:px-3">
        <p className="route-label">{project.category}</p>

        <h3 className="font-display group-hover:text-accent mt-3 text-2xl font-bold tracking-tight transition-colors duration-300">
          {project.title}
        </h3>

        <p className="text-muted mt-3 leading-relaxed">{project.description}</p>

        <ul className="mt-5 flex flex-wrap gap-1.5">
          {project.tech.slice(0, 5).map((item) => (
            <li
              key={item}
              className="text-muted rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[11px]"
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex items-center justify-between gap-4 border-t border-line-soft pt-5">
          {/* Stretched link: covers the whole card without nesting interactives */}
          <button
            type="button"
            onClick={() => onOpen(project)}
            className="group-hover:text-accent text-sm font-medium transition-colors after:absolute after:inset-0 after:rounded-2xl after:content-['']"
          >
            Read the case study
            <span className="sr-only"> for {project.title}</span>
          </button>

          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted hover:border-accent/50 hover:text-accent relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm transition-colors duration-300"
          >
            Live preview
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
            <span className="sr-only">of {project.title} (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </m.article>
  );
}
