import Image from "next/image";
import { UserRound } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { site } from "@/lib/site";

export function About() {
  return (
    <section id="about" className="scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading route="/about" title={site.about.heading} />

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Portrait */}
          <Reveal className="lg:col-span-5" delay={0.05}>
            <div className="glass relative aspect-4/5 overflow-hidden rounded-2xl">
              {site.about.photo ? (
                <Image
                  src={site.about.photo}
                  alt={site.about.photoAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="grid-field flex h-full flex-col items-center justify-center gap-4 text-center">
                  <span className="glass text-muted flex size-16 items-center justify-center rounded-full">
                    <UserRound className="size-7" aria-hidden="true" />
                  </span>
                  <p className="text-muted max-w-[16rem] font-mono text-xs leading-relaxed">
                    Add a photo at{" "}
                    <span className="text-accent">public/ernie.jpg</span>, then set{" "}
                    <span className="text-accent">about.photo</span> in{" "}
                    <span className="text-accent">src/lib/site.ts</span>.
                  </p>
                </div>
              )}
              <div className="from-accent/15 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />
            </div>

            <p className="text-muted mt-5 font-mono text-xs tracking-wider uppercase">
              {site.location}
            </p>
          </Reveal>

          {/* Bio + skills */}
          <div className="lg:col-span-7">
            <div className="space-y-6">
              {site.about.paragraphs.map((paragraph, index) => (
                <Reveal key={paragraph.slice(0, 24)} delay={0.05 * index}>
                  <p
                    className={
                      index === 0
                        ? "text-xl leading-relaxed text-white/90"
                        : "text-muted leading-relaxed"
                    }
                  >
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.15} className="mt-12">
              <h3 className="route-label">/skills</h3>
              <ul className="mt-5 flex flex-wrap gap-2">
                {site.skills.map((skill) => (
                  <li
                    key={skill}
                    className="border-accent/25 text-accent/90 hover:border-accent/60 hover:bg-accent/10 rounded-full border px-4 py-2 font-mono text-xs transition-colors duration-300"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
