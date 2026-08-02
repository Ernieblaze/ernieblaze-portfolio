"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Loads only the animation features this site actually uses.
 *
 * Importing `motion` pulls in the whole engine — drag, layout projection,
 * scroll linking — whether or not a page uses any of it. This site uses
 * animations, exit transitions, `whileInView`, one `whileHover` and a couple of
 * springs, all of which live in `domAnimation`; nothing here drags or animates
 * layout. Swapping `motion.div` for `m.div` under this provider ships the
 * subset instead of the lot.
 *
 * `strict` is deliberate: it makes a stray `motion.*` throw rather than
 * silently re-importing the full bundle and quietly undoing this.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
