import { chromium, devices } from "playwright";

/**
 * Scroll smoothness on a phone-class device.
 *
 * Emulates a Pixel-sized touch screen and throttles the CPU, because the jank
 * being chased here does not reproduce on a desktop that can brute-force it.
 * Scrolls the page in steps and records how long each frame took; anything over
 * ~32ms is a frame the user sees as a stutter.
 *
 *   BASE=http://localhost:3117 node scripts/perf-test.mjs
 */

const BASE = process.env.BASE || "http://localhost:3117";
const THROTTLE = Number(process.env.THROTTLE || 6);

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices["Pixel 5"],
});
const page = await context.newPage();

// Throttle the CPU the way a mid-range Android differs from this machine.
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

// Which branch of the `glass` rule this device landed on. Computed
// `backdropFilter` cannot be read back in headless Chromium — it reports
// "none" even where the rule applies — so the fill colour is the honest proxy:
// the solid value means the blur was skipped, which is what we want on a phone.
const surface = await page.evaluate(() => {
  const el = document.querySelector(".glass");
  return {
    fine: matchMedia("(pointer: fine)").matches,
    background: el ? getComputedStyle(el).backgroundColor : "n/a",
  };
});

// How much of the page mutates while it sits idle? The hero's typing animation
// should touch one span, not re-render the section around it.
const idleMutations = await page.evaluate(
  () =>
    new Promise((resolve) => {
      let count = 0;
      const observer = new MutationObserver((records) => {
        count += records.length;
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      });
      setTimeout(() => {
        observer.disconnect();
        resolve(count);
      }, 4000);
    }),
);

// Frame timing across a scripted scroll of the whole page.
const frames = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const times = [];
      let last = performance.now();
      let y = 0;
      const step = () => {
        const now = performance.now();
        times.push(now - last);
        last = now;
        y += 60;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight - window.innerHeight && times.length < 140) {
          requestAnimationFrame(step);
        } else {
          resolve(times);
        }
      };
      requestAnimationFrame(step);
    }),
);

const sorted = [...frames].sort((a, b) => a - b);
const p = (q) => sorted[Math.floor(sorted.length * q)] ?? 0;
const janky = frames.filter((t) => t > 32).length;

console.log(`CPU throttle           ${THROTTLE}x`);
console.log(`pointer: fine          ${surface.fine}  (blur ${surface.fine ? "on" : "skipped"})`);
console.log(`.glass background      ${surface.background}`);
console.log(`DOM mutations / 4s     ${idleMutations}`);
console.log(`frames sampled         ${frames.length}`);
console.log(`median frame           ${p(0.5).toFixed(1)}ms`);
console.log(`p95 frame              ${p(0.95).toFixed(1)}ms`);
console.log(`worst frame            ${Math.max(...frames).toFixed(1)}ms`);
console.log(`janky frames (>32ms)   ${janky} (${((janky / frames.length) * 100).toFixed(0)}%)`);

await browser.close();
