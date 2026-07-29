import type { ReactNode } from "react";

import { Reveal } from "@/components/reveal";

type SectionHeadingProps = {
  /** The section's anchor, shown as a monospace route — the site's eyebrow device. */
  route: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
};

export function SectionHeading({
  route,
  title,
  intro,
  align = "left",
}: SectionHeadingProps) {
  return (
    <Reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="route-label flex items-center gap-3">
        <span className="bg-accent/40 h-px w-8" aria-hidden="true" />
        {route}
      </p>
      <h2 className="font-display mt-5 text-section font-bold text-balance">{title}</h2>
      {intro ? (
        <p className="text-muted mt-5 text-lg leading-relaxed text-balance">{intro}</p>
      ) : null}
    </Reveal>
  );
}
