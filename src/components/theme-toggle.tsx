"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * Switches between the two palettes and remembers the choice.
 *
 * The initial value is read from the DOM rather than state, because the inline
 * script in <head> has already resolved and applied it — re-deciding here
 * would cause the flicker that script exists to prevent.
 *
 * Until someone picks explicitly, the device preference is followed and stays
 * live: changing the OS setting updates the page.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = (event: MediaQueryListEvent) => {
      // An explicit choice outranks the device.
      if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      const next: Theme = event.matches ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      setTheme(next);
    };

    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing can block storage; the switch still works for the
      // current page, it just won't be remembered.
    }
    setTheme(next);
  }

  const goingTo = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`glass text-muted hover:text-accent hover:border-accent/40 relative inline-flex size-11 items-center justify-center rounded-full transition-colors duration-300 ${className}`}
      aria-label={theme ? `Switch to ${goingTo} mode` : "Switch colour theme"}
      title={theme ? `Switch to ${goingTo} mode` : undefined}
    >
      {/* Both icons render and cross-fade, so the button never reflows and
          there is nothing to hydrate-mismatch before `theme` resolves. */}
      <Sun
        className={`absolute size-4 transition-all duration-300 ${
          theme === "light"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-75 -rotate-45 opacity-0"
        }`}
        aria-hidden="true"
      />
      <Moon
        className={`absolute size-4 transition-all duration-300 ${
          theme === "light"
            ? "scale-75 rotate-45 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
