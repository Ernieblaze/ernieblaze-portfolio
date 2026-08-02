"use client";

import type { ComponentType } from "react";
import { m, useReducedMotion, type HTMLMotionProps } from "framer-motion";

type RevealProps = HTMLMotionProps<"div"> & {
  /** Seconds to wait before this element starts. Use for staggering siblings. */
  delay?: number;
  /** Travel distance in px. Keep it small — this is a settle, not a slide. */
  distance?: number;
  as?: "div" | "section" | "li" | "article" | "header" | "footer";
};

/**
 * Scroll-triggered fade with a slight upward settle.
 *
 * When the visitor prefers reduced motion the content renders in place with no
 * transform and no fade — it never depends on animation to become visible.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 18,
  as = "div",
  ...rest
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  // The element varies but the props don't; motion's per-tag types can't
  // express that, so the tag is narrowed to one shared prop shape.
  const Component = m[as] as unknown as ComponentType<HTMLMotionProps<"div">>;

  if (reduceMotion) {
    const { initial, whileInView, viewport, transition, ...plain } = rest;
    void initial;
    void whileInView;
    void viewport;
    void transition;
    return <Component {...plain}>{children}</Component>;
  }

  return (
    <Component
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Component>
  );
}
