"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Mail, Send } from "lucide-react";

import { Magnetic } from "@/components/magnetic-button";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { brandIcons } from "@/components/brand-icons";
import { site } from "@/lib/site";

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-fg placeholder:text-muted/70 transition-colors duration-300 focus:border-accent/60 focus:bg-surface-hover focus:outline-none";

export function Contact() {
  const [sent, setSent] = useState(false);

  /**
   * v1 hands the message to the visitor's mail client, so no server, no
   * third-party form service, and nothing to leak.
   *
   * TODO (real backend): POST to /api/contact and send through Resend or
   * Postmark. Add a honeypot field and rate limiting at the same time — a
   * public form with an email behind it will get scraped.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");

    const subject = encodeURIComponent(`New project enquiry — ${name}`);
    const body = encodeURIComponent(`${message}\n\n—\n${name}\n${email}`);
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;

    setSent(true);
  }

  return (
    <section id="contact" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          route="/contact"
          title="Tell me what you're building."
          intro="Describe the problem in a few lines. I reply to everything within one working day, even if it's to say I'm not the right fit."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Form */}
          <Reveal className="lg:col-span-7">
            <div className="glass rounded-2xl p-6 sm:p-8">
              {sent ? (
                <div className="flex flex-col items-start gap-5 py-6">
                  <span className="bg-accent/15 text-accent flex size-12 items-center justify-center rounded-full">
                    <Check className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-bold tracking-tight">
                      Your email client is open.
                    </h3>
                    <p className="text-muted mt-3 leading-relaxed">
                      Send the draft and it lands with me directly. If nothing
                      opened, write to{" "}
                      <a
                        href={`mailto:${site.email}`}
                        className="text-accent underline underline-offset-4"
                      >
                        {site.email}
                      </a>
                      .
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="text-muted hover:text-accent text-sm underline underline-offset-4 transition-colors"
                  >
                    Write another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="text-muted mb-2 block font-mono text-xs tracking-wider uppercase"
                      >
                        Your name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Sam Okoye"
                        className={FIELD_CLASS}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="text-muted mb-2 block font-mono text-xs tracking-wider uppercase"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="sam@company.com"
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="text-muted mb-2 block font-mono text-xs tracking-wider uppercase"
                    >
                      What do you need?
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      placeholder="We run a two-site dental practice and our booking page loses people at the form. Rough budget and timeline included if you have them."
                      className={`${FIELD_CLASS} resize-y`}
                    />
                  </div>

                  <Magnetic>
                    <button
                      type="submit"
                      className="bg-accent group inline-flex items-center gap-2 rounded-full px-7 py-4 font-medium text-on-accent transition-shadow duration-500 hover:shadow-[0_0_44px_-6px_var(--glow-strong)]"
                    >
                      Send message
                      <Send
                        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </button>
                  </Magnetic>
                </form>
              )}
            </div>
          </Reveal>

          {/* Direct routes */}
          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="flex h-full flex-col gap-4">
              <a
                href={`mailto:${site.email}`}
                className="group hover:border-accent/30 flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6 transition-colors duration-300"
              >
                <span className="min-w-0">
                  <span className="route-label block">Email</span>
                  <span className="group-hover:text-accent mt-2 block truncate text-lg transition-colors">
                    {site.email}
                  </span>
                </span>
                <Mail
                  className="text-muted group-hover:text-accent size-5 shrink-0 transition-colors"
                  aria-hidden="true"
                />
              </a>

              {site.socials.map((social) => {
                const Icon = brandIcons[social.name];
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group hover:border-accent/30 flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6 transition-colors duration-300"
                  >
                    <span className="min-w-0">
                      <span className="route-label block">{social.name}</span>
                      <span className="group-hover:text-accent mt-2 block truncate text-lg transition-colors">
                        {social.handle}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Icon className="text-muted group-hover:text-accent size-4 transition-colors" />
                      <ArrowUpRight
                        className="text-muted group-hover:text-accent size-4 transition-colors"
                        aria-hidden="true"
                      />
                    </span>
                  </a>
                );
              })}

              <div className="border-accent/25 from-accent/10 mt-auto rounded-2xl border bg-gradient-to-br to-transparent p-6">
                <p className="flex items-center gap-2.5 font-mono text-xs tracking-wider uppercase">
                  <span
                    className="bg-accent animate-pulse-dot size-2 rounded-full"
                    aria-hidden="true"
                  />
                  <span className="text-accent">{site.availability.label}</span>
                </p>
                <p className="text-muted mt-3 leading-relaxed">
                  {site.availability.detail}. {site.location}.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
