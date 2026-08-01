export const THEME_STORAGE_KEY = "eb-theme";

export type Theme = "dark" | "light";

/**
 * Runs before the first paint, inlined into <head>.
 *
 * Without this the page renders in one theme and then swaps, which is the
 * flicker you see on a lot of sites with a dark mode. Keep it small,
 * synchronous, and dependency-free — anything that defers defeats the point.
 *
 * No stored choice means "follow the device", so the OS setting wins on a
 * first visit and a later change to it is picked up automatically.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    var theme = stored === "dark" || stored === "light"
      ? stored
      : (prefersLight ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`.trim();
