import { chromium } from "playwright";

const BASE = "http://localhost:3117";
const OUT = process.argv[2] ?? "./shots";

const browser = await chromium.launch();

/** Scroll the whole page so IntersectionObserver reveals fire before capture. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 160));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

async function shot(
  name,
  url,
  { width = 1440, height = 900, full = false, wait = 1600, mobile = false, at = null } = {},
) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
  });
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
  await scrollThrough(page);
  if (at !== null) {
    await page.evaluate((y) => window.scrollTo(0, y), at);
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await page.close();
  console.log("shot", name);
}

const only = process.argv[3];
const jobs = {
  "home-hero": () => shot("home-hero", "/"),
  "home-full": () => shot("home-full", "/", { full: true }),
  "home-work": () => shot("home-work", "/", { at: 1150 }),
  "home-about": () => shot("home-about", "/", { at: 3050 }),
  "home-services": () => shot("home-services", "/", { at: 4100 }),
  "home-contact": () => shot("home-contact", "/", { at: 5200 }),
  mobile: () => shot("mobile", "/", { width: 390, height: 844, full: true, mobile: true }),
  project: () => shot("project", "/work/vertex-fitness", { full: true }),
  admin: () => shot("admin", "/admin"),
};

for (const [name, run] of Object.entries(jobs)) {
  if (only && name !== only) continue;
  await run();
}

await browser.close();
