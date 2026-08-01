import { chromium } from "playwright";

/**
 * Section navigation: does every nav link land its section in the same place?
 *
 * `scroll-padding-top` in globals.css is the single source of truth for that
 * position. If a section also carries `scroll-mt-*` the two stack and the jump
 * lands twice as far down — invisible in code review, obvious here.
 *
 * The mobile pass matters most: the menu locks body scroll while it is open, so
 * a link that doesn't close it first has its scroll silently swallowed.
 *
 *   BASE=http://localhost:3117 npm run test:nav
 */

const BASE = process.env.BASE || "http://localhost:3117";

/** Must match `scroll-padding-top` (5.5rem) in src/app/globals.css. */
const EXPECTED_TOP = 88;
const TOLERANCE = 2;

const SECTIONS = ["work", "about", "services", "contact"];

const browser = await chromium.launch();
const failures = [];

function check(label, actual) {
  const ok = actual !== null && Math.abs(actual - EXPECTED_TOP) <= TOLERANCE;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label.padEnd(26)} sectionTop=${actual ?? "n/a"}`,
  );
  if (!ok) failures.push(`${label} (sectionTop=${actual ?? "n/a"})`);
}

async function run(label, viewport, isMobile) {
  const page = await browser.newPage({ viewport });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  console.log(`\n=== ${label} (${viewport.width}x${viewport.height}) ===`);

  for (const id of SECTIONS) {
    // Back to the top between each, the way a visitor arrives. This must be
    // instant: `scroll-behavior: smooth` makes a plain scrollTo animate too,
    // and a reset still in flight collides with the click we're about to make.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 5000 });
    await page.waitForTimeout(300);

    if (isMobile) {
      await page.click('button[aria-label="Open menu"]');
      // The items stagger in (the last starts at 0.36s and runs 0.5s), so a
      // shorter wait clicks a link that is still moving.
      await page.waitForTimeout(1200);
    }

    // Scope to the real nav — the sr-only "Skip to work" link also has #work.
    const nav = isMobile ? 'nav[aria-label="Mobile"]' : 'nav[aria-label="Primary"]';
    try {
      await page.locator(`${nav} a[href="#${id}"]`).first().click({ timeout: 8000 });
    } catch (error) {
      console.log(`  click failed: ${error.message.split("\n")[0]}`);
    }

    // Wait for the scroll to settle rather than guessing a duration — reaching
    // the last section covers thousands of pixels and outlasts a fixed wait,
    // which reads as a failure when nothing is wrong.
    await page
      .waitForFunction(
        () => {
          const w = window;
          if (w.__lastY === w.scrollY) return (w.__still = (w.__still ?? 0) + 1) > 3;
          w.__lastY = w.scrollY;
          w.__still = 0;
          return false;
        },
        null,
        { timeout: 10000, polling: 100 },
      )
      .catch(() => console.log("  scroll never settled"));

    const top = await page.evaluate((id) => {
      const el = document.getElementById(id);
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    }, id);

    check(`${label} #${id}`, top);
  }

  await page.close();
}

await run("desktop", { width: 1440, height: 900 }, false);
await run("mobile", { width: 390, height: 844 }, true);
await browser.close();

console.log(
  failures.length
    ? `\n${failures.length} FAILED:\n  ${failures.join("\n  ")}`
    : `\nALL PASS — every section lands at ${EXPECTED_TOP}px`,
);
process.exit(failures.length ? 1 : 0);
