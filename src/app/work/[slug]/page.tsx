import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { Ambient } from "@/components/ambient";
import { BrowserFrame } from "@/components/browser-frame";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getProjectBySlug, getPublishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Per request, for the same reason as the homepage — see src/app/page.tsx. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) return { title: "Project not found" };

  const url = `${site.url}/work/${project.slug}`;

  return {
    title: `${project.title} — ${project.category}`,
    description: project.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${project.title} — built by ${site.name}`,
      description: project.description,
      images: [{ url: project.images[0], width: 1600, height: 1000 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} — built by ${site.name}`,
      description: project.description,
      images: [project.images[0]],
    },
  };
}

const CHAPTERS = [
  { key: "problem", label: "The problem" },
  { key: "solution", label: "What I built" },
  { key: "result", label: "The result" },
] as const;

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project || !project.published) notFound();

  const others = (await getPublishedProjects())
    .filter((item) => item.id !== project.id)
    .slice(0, 3);

  return (
    <>
      <Ambient />
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-5 pt-32 pb-24 sm:px-8 sm:pt-40">
        <Link
          href="/#work"
          className="text-muted hover:text-accent inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All work
        </Link>

        <Reveal className="mt-8">
          <p className="route-label">{project.category}</p>
          <h1 className="font-display mt-5 text-section font-bold text-balance">
            {project.title}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-white/85 text-balance">
            {project.description}
          </p>

          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="bg-accent mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-medium text-black transition-shadow duration-500 hover:shadow-[0_0_44px_-6px_#00f0ff]"
          >
            Visit {hostname(project.liveUrl)}
            <ArrowUpRight className="size-4" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Reveal>

        <div className="mt-14 space-y-6">
          {project.images.map((src, index) => (
            <Reveal key={src} delay={index * 0.06}>
              <BrowserFrame
                address={hostname(project.liveUrl)}
                className="shadow-[0_40px_120px_-60px_rgba(0,240,255,0.4)]"
              >
                <div className="relative aspect-16/10">
                  <Image
                    src={src}
                    alt={`${project.title} screenshot ${index + 1} of ${project.images.length}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-cover object-top"
                    priority={index === 0}
                  />
                </div>
              </BrowserFrame>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-8">
            {CHAPTERS.map(({ key, label }, index) =>
              project.caseStudy[key] ? (
                <Reveal key={key} delay={index * 0.05}>
                  <div className="border-l border-white/10 pl-6">
                    <h2 className="route-label">{label}</h2>
                    <p className="text-muted mt-4 text-lg leading-relaxed">
                      {project.caseStudy[key]}
                    </p>
                  </div>
                </Reveal>
              ) : null,
            )}
          </div>

          <Reveal delay={0.1} className="lg:col-span-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="route-label">/stack</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.tech.map((item) => (
                  <li
                    key={item}
                    className="border-accent/25 text-accent/90 rounded-full border px-3 py-1.5 font-mono text-xs"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Next projects */}
        {others.length > 0 ? (
          <Reveal className="mt-24 border-t border-white/10 pt-12">
            <h2 className="route-label">/more-work</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {others.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/work/${item.slug}`}
                    className="group hover:border-accent/30 block rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors"
                  >
                    <div className="relative aspect-16/10 overflow-hidden rounded-lg">
                      <Image
                        src={item.images[0]}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
                      />
                    </div>
                    <p className="font-display group-hover:text-accent mt-4 px-1 pb-2 font-bold tracking-tight transition-colors">
                      {item.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </main>

      <SiteFooter />
    </>
  );
}
