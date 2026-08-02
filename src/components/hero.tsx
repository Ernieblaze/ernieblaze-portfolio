"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Mail } from "lucide-react";

import { Magnetic } from "@/components/magnetic-button";
import { BrowserFrame } from "@/components/browser-frame";
import { ParticleField } from "@/components/particle-field";
import { brandIcon } from "@/components/brand-icons";
import type { Project, SiteContent } from "@/lib/types";

const TYPE_MS = 55;
const HOLD_MS = 2800;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Types one address out, a character at a time.
 *
 * This is its own component on purpose. The character counter changes ~18 times
 * a second, and when that state lived in `Hero` every tick re-rendered the
 * whole hero — heading, stats, image, and twenty-odd motion elements — for the
 * sake of one more letter in a span. Keeping it in a leaf means React only
 * reconciles this span, and the rest of the hero renders when the project
 * actually changes.
 */
function TypedAddress({ value, enabled }: { value: string; enabled: boolean }) {
  const [chars, setChars] = useState(enabled ? 0 : value.length);

  useEffect(() => {
    if (!enabled) {
      setChars(value.length);
      return;
    }

    setChars(0);
    let typed = 0;
    const timer = setInterval(() => {
      typed += 1;
      setChars(typed);
      // Stop the moment the address is complete — nothing should keep ticking
      // for the seconds this address is held on screen.
      if (typed >= value.length) clearInterval(timer);
    }, TYPE_MS);

    return () => clearInterval(timer);
  }, [value, enabled]);

  const complete = chars >= value.length;

  return (
    <span className="flex items-center">
      <span className="text-fg/70">{value.slice(0, chars)}</span>
      {!complete && (
        <span
          className="bg-accent-vivid animate-caret ml-0.5 inline-block h-3 w-[2px] align-middle"
          aria-hidden="true"
        />
      )}
    </span>
  );
}

/**
 * Rotates through the showcased projects.
 *
 * Each one is held for as long as it takes to type its address plus a beat, so
 * the rotation stays in step with `TypedAddress` without the two needing to
 * talk to each other.
 */
function useShowcaseIndex(addresses: string[], enabled: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || addresses.length < 2) return;

    const current = addresses[index % addresses.length] ?? "";
    const dwell = current.length * TYPE_MS + HOLD_MS;

    const timer = setTimeout(
      () => setIndex((n) => (n + 1) % addresses.length),
      dwell,
    );
    return () => clearTimeout(timer);
  }, [addresses, enabled, index]);

  return addresses.length ? index % addresses.length : 0;
}

export function Hero({
  projects,
  content,
}: {
  projects: Project[];
  content: SiteContent;
}) {
  const reduceMotion = useReducedMotion();
  const showcase = useMemo(() => projects.slice(0, 4), [projects]);
  const addresses = useMemo(
    () => showcase.map((project) => hostname(project.liveUrl)),
    [showcase],
  );

  /*
   * The headline stacks the name over two lines. It used to be two hardcoded
   * words; now that the name is editable it is split on the last space, so
   * "Ernie Blaze" still breaks the same way and a single word or a longer name
   * both render sensibly instead of breaking the layout.
   */
  const [firstName, lastName] = useMemo(() => {
    const parts = content.name.trim().split(/\s+/);
    if (parts.length < 2) return [content.name.trim(), ""];
    return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
  }, [content.name]);

  const index = useShowcaseIndex(addresses, !reduceMotion);
  const active = showcase[index];

  return (
    <section
      className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28"
      id="top"
    >
      {/* The one animated background on the site. Fades out at the edges so it
          reads as atmosphere rather than a boxed-in effect. */}
      <ParticleField className="-z-10 [mask-image:radial-gradient(80%_75%_at_50%_40%,black,transparent)]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
          {/* ------------------------------------------------------- copy */}
          <div className="lg:col-span-6 xl:col-span-6">
            <m.p
              className="flex"
              initial={reduceMotion ? undefined : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/*
                A pill rather than loose text: on light mode a cyan label
                floating on off-white had nothing holding it, and it read as a
                stray line rather than a status.
              */}
              <span className="glass inline-flex items-center gap-2.5 rounded-full py-2 pr-4 pl-3">
                <span className="relative flex size-2 shrink-0">
                  {content.availability.open && (
                    <span
                      className="bg-accent-vivid animate-pulse-dot absolute inline-flex size-full rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`relative inline-flex size-2 rounded-full ${
                      content.availability.open ? "bg-accent-vivid" : "bg-muted"
                    }`}
                    aria-hidden="true"
                  />
                </span>
                <span className="route-label">{content.availability.label}</span>
              </span>
            </m.p>

            <m.h1
              className="font-display mt-6 text-display font-bold"
              initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              {firstName}
              {lastName && (
                <>
                  {/* The space is for anything reading the text rather than
                      seeing it — a <br> renders no character, so without this
                      the heading is announced and indexed as "ErnieBlaze". */}{" "}
                  <br />
                  <span className="name-fade">{lastName}</span>
                </>
              )}
            </m.h1>

            <m.p
              className="mt-8 max-w-xl text-lg leading-relaxed text-fg/85 text-balance sm:text-xl"
              initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              {content.tagline}
            </m.p>

            <m.p
              className="text-muted mt-4 max-w-lg leading-relaxed"
              initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {content.heroSupport}
            </m.p>

            <m.div
              className="mt-10 flex flex-wrap items-center gap-3"
              initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Magnetic>
                <a
                  href="#work"
                  className="bg-accent-vivid group inline-flex items-center gap-2 rounded-full px-7 py-4 font-medium text-on-accent shadow-[0_0_0_0_var(--glow-strong)] transition-shadow duration-500 hover:shadow-[0_0_44px_-6px_var(--glow-strong)]"
                >
                  View my work
                  <ArrowDown
                    className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </Magnetic>

              <Magnetic>
                <a
                  href="#contact"
                  className="glass hover:border-accent/50 hover:text-accent group inline-flex items-center gap-2 rounded-full px-7 py-4 font-medium transition-colors duration-300"
                >
                  Let&rsquo;s talk
                  <ArrowUpRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </Magnetic>
            </m.div>

            {/* Socials */}
            <m.ul
              className="mt-10 flex items-center gap-2"
              initial={reduceMotion ? undefined : { opacity: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {content.socials.map((social) => {
                const Icon = brandIcon(social.name);
                return (
                  <li key={social.name}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-muted hover:border-accent/40 hover:text-accent glass flex size-11 items-center justify-center rounded-full transition-all duration-300 hover:shadow-[0_0_24px_-8px_var(--glow-strong)]"
                      aria-label={`${content.name} on ${social.name}`}
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                );
              })}
              <li>
                <a
                  href={`mailto:${content.email}`}
                  className="text-muted hover:border-accent/40 hover:text-accent glass flex size-11 items-center justify-center rounded-full transition-all duration-300 hover:shadow-[0_0_24px_-8px_var(--glow-strong)]"
                  aria-label={`Email ${content.name}`}
                >
                  <Mail className="size-4" aria-hidden="true" />
                </a>
              </li>
            </m.ul>
          </div>

          {/* -------------------------------------------------- showcase */}
          <m.div
            className="lg:col-span-6"
            initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {active ? (
              <>
                <BrowserFrame
                  className="shadow-[0_40px_120px_-40px_var(--glow-mid)]"
                  address={
                    <TypedAddress
                      value={addresses[index] ?? ""}
                      enabled={!reduceMotion}
                    />
                  }
                >
                  <div className="relative aspect-16/10">
                    <AnimatePresence mode="sync">
                      <m.div
                        key={active.id}
                        className="absolute inset-0"
                        initial={reduceMotion ? undefined : { opacity: 0, scale: 1.02 }}
                        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Image
                          src={active.images[0]}
                          alt={`${active.title} homepage`}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover object-top"
                          priority
                        />
                      </m.div>
                    </AnimatePresence>
                  </div>
                </BrowserFrame>

                {/* Caption ties the frame to the project it is showing */}
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-muted min-w-0 truncate text-sm">
                    <span className="text-fg">{active.title}</span>
                    <span className="mx-2 text-fg/20">/</span>
                    {active.category}
                  </p>
                  <a
                    href={`#${active.slug}`}
                    className="text-accent hover:text-accent-hover shrink-0 font-mono text-xs tracking-wider uppercase transition-colors"
                  >
                    See the build
                  </a>
                </div>
              </>
            ) : (
              <BrowserFrame address={content.domain}>
                <div className="text-muted flex aspect-16/10 items-center justify-center text-sm">
                  No projects published yet.
                </div>
              </BrowserFrame>
            )}
          </m.div>
        </div>

        {/* Stats strip */}
        <m.dl
          className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3"
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.5 }}
        >
          {content.stats.map((stat) => (
            <div key={stat.label} className="bg-ink-raised px-6 py-7">
              <dt className="text-muted font-mono text-xs tracking-wider uppercase">
                {stat.label}
              </dt>
              <dd className="font-display mt-2 text-3xl font-bold tracking-tight">
                {stat.value}
              </dd>
            </div>
          ))}
        </m.dl>
      </div>
    </section>
  );
}
