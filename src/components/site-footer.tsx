import Link from "next/link";
import { ArrowUp } from "lucide-react";

import { brandIcon } from "@/components/brand-icons";
import type { SiteContent } from "@/lib/types";

export function SiteFooter({ content }: { content: SiteContent }) {
  return (
    <footer className="border-t border-line">
      {/* Marquee of the site's own address — the signature device, one last time */}
      <div
        className="overflow-hidden border-b border-line-soft py-5"
        aria-hidden="true"
      >
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap motion-reduce:animate-none">
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={index}
              className="flex items-center gap-10 font-mono text-sm tracking-wider text-fg/10 uppercase"
            >
              {content.domain}
              <span className="text-accent/30">/</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="font-display text-lg font-bold tracking-tight">
            {content.name}
          </Link>
          <p className="text-muted mt-2 text-sm">
            {content.role} · {content.location}
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {content.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted hover:text-accent font-mono text-xs tracking-wider uppercase transition-colors"
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/admin"
            className="text-muted/50 hover:text-accent font-mono text-xs tracking-wider uppercase transition-colors"
          >
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {content.socials.map((social) => {
            const Icon = brandIcon(social.name);
            return (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-muted hover:border-accent/40 hover:text-accent glass flex size-10 items-center justify-center rounded-full transition-colors duration-300"
                aria-label={`${content.name} on ${social.name}`}
              >
                <Icon className="size-4" />
              </a>
            );
          })}
          <a
            href="#top"
            className="text-muted hover:border-accent/40 hover:text-accent glass flex size-10 items-center justify-center rounded-full transition-colors duration-300"
            aria-label="Back to top"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <p className="text-muted/60 font-mono text-xs">
          © {new Date().getFullYear()} {content.name}. Built with Next.js.
        </p>
      </div>
    </footer>
  );
}
