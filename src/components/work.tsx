"use client";

import { useState } from "react";

import { ProjectCard } from "@/components/project-card";
import { ProjectModal } from "@/components/project-modal";
import { SectionHeading } from "@/components/section-heading";
import type { Project } from "@/lib/types";

export function Work({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<Project | null>(null);

  return (
    <section id="work" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          route="/work"
          title="Selected work"
          intro={
            // Don't promise a number of builds when there aren't any to show.
            projects.length > 0
              ? "Recent builds, each with the problem it was hired to solve and what happened after launch."
              : undefined
          }
        />

        {projects.length > 0 ? (
          <div className="mt-14 grid gap-6 sm:mt-16 lg:grid-cols-2 lg:gap-8">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onOpen={setActive}
              />
            ))}
          </div>
        ) : (
          <div className="glass mt-14 rounded-2xl px-6 py-16 text-center">
            <p className="text-muted">
              No projects published yet. Add the first one from the dashboard at{" "}
              <span className="text-accent font-mono">/admin</span>.
            </p>
          </div>
        )}
      </div>

      <ProjectModal project={active} onClose={() => setActive(null)} />
    </section>
  );
}
