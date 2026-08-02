"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's living background: drifting nodes that link to their neighbours
 * and lean toward the cursor.
 *
 * Deliberately the only animated background on the site. Everything below the
 * hero stays still so the work itself is what moves the eye.
 *
 * Kept cheap on purpose:
 *  - particle count scales with viewport area and is capped hard on phones
 *  - links are only drawn between nearby particles, using a spatial grid so
 *    cost stays near-linear instead of checking every pair
 *  - the loop stops entirely when the hero scrolls out of view or the tab is
 *    hidden, so it never burns battery in the background
 *  - reduced-motion renders a single still frame and never starts a loop
 */

const LINK_DISTANCE = 128;
const POINTER_RADIUS = 170;
const MAX_PARTICLES = 90;

/*
 * Phone budget.
 *
 * The link pass is the expensive half: it walks neighbouring cells and strokes
 * a line per pair, and stroking is far dearer than filling a dot. On a narrow
 * screen the lines are also the part nobody looks at, so below this width the
 * field draws dots only — which is most of the beauty at a fraction of the
 * cost. Device pixel ratio is capped harder too: Android phones routinely
 * report 3, and rendering the canvas at 3× is triple the fill rate for a
 * difference no one can see on a background of soft dots.
 */
const NARROW_WIDTH = 640;
const MAX_DPR_NARROW = 1.5;
const MAX_DPR_WIDE = 2;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

function readTheme() {
  const styles = getComputedStyle(document.documentElement);
  return {
    rgb: styles.getPropertyValue("--particle").trim() || "0 240 255",
    dotAlpha: Number(styles.getPropertyValue("--particle-opacity")) || 0.7,
    linkAlpha: Number(styles.getPropertyValue("--particle-link-opacity")) || 0.15,
  };
}

export function ParticleField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    let drawLinks = true;
    let theme = readTheme();

    const pointer = { x: -9999, y: -9999, active: false };

    function resize() {
      if (!canvas || !context) return;
      const rect = canvas.getBoundingClientRect();
      const narrow = rect.width < NARROW_WIDTH;
      drawLinks = !narrow;

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        narrow ? MAX_DPR_NARROW : MAX_DPR_WIDE,
      );

      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Roughly one particle per 13k px², so a phone gets a handful and a
      // desktop gets a field — without either looking sparse or soupy. Phones
      // are thinned further: fewer, slightly larger dots read better small and
      // cost less per frame.
      const density = narrow ? 22000 : 13000;
      const target = Math.min(
        MAX_PARTICLES,
        Math.max(narrow ? 12 : 18, Math.round((width * height) / density)),
      );

      particles = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        radius: Math.random() * 1.5 + 0.7,
      }));
    }

    function draw() {
      if (!context) return;
      context.clearRect(0, 0, width, height);

      if (drawLinks) drawLinkPass();
      drawDots();
    }

    function drawDots() {
      if (!context) return;
      // One fillStyle for the whole pass — setting it per particle forces the
      // canvas to re-parse the colour string on every dot, every frame.
      context.fillStyle = `rgb(${theme.rgb} / ${theme.dotAlpha})`;
      for (const particle of particles) {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    function drawLinkPass() {
      if (!context) return;

      // Bucket particles into cells the size of the link radius, so each one
      // only tests its own cell and the neighbours it hasn't seen yet.
      const cols = Math.max(1, Math.ceil(width / LINK_DISTANCE));
      const rows = Math.max(1, Math.ceil(height / LINK_DISTANCE));
      const grid: number[][] = Array.from({ length: cols * rows }, () => []);

      particles.forEach((particle, index) => {
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(particle.x / LINK_DISTANCE)));
        const cy = Math.min(rows - 1, Math.max(0, Math.floor(particle.y / LINK_DISTANCE)));
        grid[cy * cols + cx].push(index);
      });

      context.lineWidth = 1;

      for (let cy = 0; cy < rows; cy += 1) {
        for (let cx = 0; cx < cols; cx += 1) {
          const cell = grid[cy * cols + cx];
          if (cell.length === 0) continue;

          // Own cell, plus right / below / both diagonals — each pair once.
          const neighbours = [
            cell,
            cx + 1 < cols ? grid[cy * cols + cx + 1] : [],
            cy + 1 < rows ? grid[(cy + 1) * cols + cx] : [],
            cx + 1 < cols && cy + 1 < rows ? grid[(cy + 1) * cols + cx + 1] : [],
            cx > 0 && cy + 1 < rows ? grid[(cy + 1) * cols + cx - 1] : [],
          ];

          for (const a of cell) {
            for (let n = 0; n < neighbours.length; n += 1) {
              for (const b of neighbours[n]) {
                if (n === 0 && b <= a) continue;

                const p = particles[a];
                const q = particles[b];
                const dx = p.x - q.x;
                const dy = p.y - q.y;
                const distanceSquared = dx * dx + dy * dy;
                if (distanceSquared > LINK_DISTANCE * LINK_DISTANCE) continue;

                const strength = 1 - Math.sqrt(distanceSquared) / LINK_DISTANCE;
                context.strokeStyle = `rgb(${theme.rgb} / ${strength * theme.linkAlpha})`;
                context.beginPath();
                context.moveTo(p.x, p.y);
                context.lineTo(q.x, q.y);
                context.stroke();
              }
            }
          }
        }
      }

    }

    function step() {
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap rather than bounce — bouncing makes the edges legible as walls.
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;

        if (!pointer.active) continue;

        const dx = pointer.x - particle.x;
        const dy = pointer.y - particle.y;
        const distance = Math.hypot(dx, dy);
        if (distance > POINTER_RADIUS || distance === 0) continue;

        // A slight lean toward the cursor, capped so nothing gets flung.
        const pull = (1 - distance / POINTER_RADIUS) * 0.045;
        particle.vx += (dx / distance) * pull;
        particle.vy += (dy / distance) * pull;

        const speed = Math.hypot(particle.vx, particle.vy);
        if (speed > 0.9) {
          particle.vx = (particle.vx / speed) * 0.9;
          particle.vy = (particle.vy / speed) * 0.9;
        }
      }

      draw();
      frame = requestAnimationFrame(step);
    }

    function start() {
      if (running || reduceMotion.matches) return;
      running = true;
      frame = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    resize();
    if (reduceMotion.matches) {
      // Still frame: the composition without the movement.
      draw();
    } else {
      start();
    }

    // --- listeners -------------------------------------------------------

    const onResize = () => {
      resize();
      if (!running) draw();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const onThemeChange = () => {
      theme = readTheme();
      if (!running) draw();
    };

    // Only animate while the hero is actually on screen.
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    observer.observe(canvas);

    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    reduceMotion.addEventListener("change", onResize);

    return () => {
      stop();
      observer.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMotion.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 size-full ${className}`}
    />
  );
}
