"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { m, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

type MagneticProps = {
  children: ReactNode;
  /** How far the element may drift toward the cursor, in px. */
  strength?: number;
  className?: string;
};

/**
 * Wraps an interactive element so it leans very slightly toward the cursor.
 *
 * The pull is deliberately small — it should register as responsiveness, not
 * as a moving target. Pointer tracking is skipped entirely under reduced
 * motion and on touch devices, where there is no hover to respond to.
 */
export function Magnetic({ children, strength = 8, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  // There is no cursor to lean toward on a phone, so the springs would animate
  // nothing while still mounting a motion component and subscribing to frames.
  // Starting false means the server and the first client render agree; touch
  // devices simply never flip it on.
  const [hasPointer, setHasPointer] = useState(false);
  useEffect(() => {
    setHasPointer(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 22, mass: 0.4 });

  if (reduceMotion || !hasPointer) {
    return <span className={className}>{children}</span>;
  }

  return (
    <m.span
      ref={ref}
      className={className}
      style={{ x: springX, y: springY, display: "inline-block" }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const offsetX = event.clientX - (rect.left + rect.width / 2);
        const offsetY = event.clientY - (rect.top + rect.height / 2);
        x.set((offsetX / (rect.width / 2)) * strength);
        y.set((offsetY / (rect.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </m.span>
  );
}
