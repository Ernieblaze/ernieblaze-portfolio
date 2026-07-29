"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { site } from "@/lib/site";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the mobile menu, and let Escape close it.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <a
        href="#work"
        className="bg-accent focus:ring-accent sr-only rounded-full px-4 py-2 font-medium text-black focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100"
      >
        Skip to work
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-white/10 bg-[#050505]/70 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="group flex items-baseline gap-2"
            aria-label={`${site.name} — home`}
          >
            <span className="font-display text-lg font-bold tracking-tight">
              {site.name}
            </span>
            <span
              className="bg-accent animate-pulse-dot size-1.5 rounded-full"
              aria-hidden="true"
            />
          </Link>

          {/* Desktop nav — routes, in mono, matching the address bar device */}
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-muted hover:text-accent rounded-full px-4 py-2 font-mono text-xs tracking-wider uppercase transition-colors duration-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="hover:border-accent/60 hover:bg-accent/10 hover:text-accent glass hidden rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:shadow-[0_0_28px_-6px_#00f0ff] md:inline-flex"
            >
              Start a project
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="glass hover:text-accent inline-flex size-11 items-center justify-center rounded-full transition-colors md:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-60 md:hidden"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="grid-field absolute inset-0 bg-[#050505]/95 backdrop-blur-2xl" />
            <div className="bg-accent/10 absolute -top-40 -right-20 size-[26rem] rounded-full blur-[120px]" />

            <div className="relative flex h-full flex-col">
              <div className="flex h-18 items-center justify-between px-5">
                <span className="font-display text-lg font-bold">{site.name}</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="glass hover:text-accent inline-flex size-11 items-center justify-center rounded-full transition-colors"
                  aria-label="Close menu"
                  autoFocus
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <nav
                aria-label="Mobile"
                className="flex flex-1 flex-col justify-center gap-1 px-5 pb-24"
              >
                {site.nav.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-baseline gap-4 border-b border-white/5 py-5"
                    initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.06 + index * 0.06,
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <span className="text-accent/50 font-mono text-xs">
                      {item.href}
                    </span>
                    <span className="font-display group-hover:text-accent text-4xl font-bold tracking-tight transition-colors">
                      {item.label}
                    </span>
                  </motion.a>
                ))}

                <motion.a
                  href="#contact"
                  onClick={() => setMenuOpen(false)}
                  className="bg-accent mt-10 rounded-full px-6 py-4 text-center font-medium text-black"
                  initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.36, duration: 0.5 }}
                >
                  Start a project
                </motion.a>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
