/**
 * End-to-end smoke test for the admin flow: sign in, create a project with an
 * uploaded image, confirm it appears on the public site, edit it, then delete
 * it and confirm it is gone again.
 */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const BASE = "http://localhost:3117";
const OUT = "./shots";
const PASSWORD = process.env.ADMIN_PASSWORD || "ernieblaze2026";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const fails = [];

function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) fails.push(label);
}

// --- sign in -----------------------------------------------------------
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.fill("#password", "wrong-password");
await page.click('button[type="submit"]');
await page.waitForTimeout(700);
check("wrong password is rejected", await page.locator("#password-error").isVisible());

await page.fill("#password", PASSWORD);
await page.click('button[type="submit"]');
await page.waitForSelector("text=Add project", { timeout: 10000 });
check("correct password signs in", true);
await page.screenshot({ path: `${OUT}/admin-dashboard.png`, fullPage: true });

// --- create ------------------------------------------------------------
await page.click("text=Add project");
await page.waitForSelector("#title");
await page.fill("#title", "Smoke Test Studio");
await page.fill("#category", "Landing Page");
await page.fill("#description", "A temporary project created by the smoke test.");
await page.fill("#liveUrl", "smoketest.example.com");
await page.fill("#tech", "Next.js, Tailwind CSS");
await page.fill("#problem", "The smoke test needed something to create.");
await page.fill("#solution", "It created this.");
await page.fill("#result", "It worked.");

const buffer = await readFile("./public/seed/lumen-home.png");
await page.setInputFiles('input[type="file"]', {
  name: "smoke.png",
  mimeType: "image/png",
  buffer,
});
await page.waitForSelector("text=COVER", { timeout: 15000 });
check("image uploads and previews", true);

await page.screenshot({ path: `${OUT}/admin-form.png`, fullPage: true });

// The uploaded file must be reachable straight away — from the Supabase
// bucket directly, and through next/image (which proves the host is
// allow-listed in next.config.ts).
const uploadedSrc = await page.locator('img[alt="Screenshot 1"]').getAttribute("src");
const optimiserUrl = new URL(uploadedSrc, BASE);
const originUrl = decodeURIComponent(
  optimiserUrl.searchParams.get("url") ?? uploadedSrc,
);

check(
  "uploaded image is stored in Supabase",
  originUrl.includes("/storage/v1/object/public/project-images/"),
);
check(
  "uploaded image is served from the bucket",
  (await page.request.get(originUrl)).status() === 200,
);
check(
  "uploaded image is served through next/image",
  (await page.request.get(optimiserUrl.toString())).status() === 200,
);

await page.click('button:has-text("Add project")');
await page.waitForTimeout(2500);
check(
  "project appears in the admin list",
  (await page.locator("h3", { hasText: "Smoke Test Studio" }).count()) > 0,
);

// --- appears publicly --------------------------------------------------
const publicPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await publicPage.goto(`${BASE}/`, { waitUntil: "networkidle" });
check(
  "project appears on the public site immediately",
  (await publicPage.locator("text=Smoke Test Studio").count()) > 0,
);

// --- modal opens -------------------------------------------------------
await publicPage.locator('button:has-text("Read the case study")').first().click();
await publicPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
await publicPage.waitForTimeout(900);
await publicPage.screenshot({ path: `${OUT}/modal.png` });
check("case study modal opens", await publicPage.locator('[role="dialog"]').isVisible());

await publicPage.keyboard.press("Escape");
await publicPage.waitForTimeout(1400);
check(
  "Escape closes the modal",
  (await publicPage.locator('[role="dialog"]').count()) === 0,
);

// --- dedicated page ----------------------------------------------------
const detail = await publicPage.goto(`${BASE}/work/smoke-test-studio`);
check("project has its own page", detail?.status() === 200);
await publicPage.close();

// --- edit --------------------------------------------------------------
await page.locator('button:has-text("Edit")').first().click();
await page.waitForSelector("#title");
await page.fill("#title", "Smoke Test Studio (edited)");
await page.click('button:has-text("Save changes")');
await page.waitForTimeout(2500);
check(
  "edit saves",
  (await page.locator("h3", { hasText: "Smoke Test Studio (edited)" }).count()) > 0,
);

// --- validation --------------------------------------------------------
const rejected = await page.evaluate(async () => {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Bad",
      description: "Bad",
      liveUrl: "javascript:alert(1)",
      images: ["/seed/lumen-home.png"],
      caseStudy: {},
    }),
  });
  return response.status;
});
check("javascript: URLs are rejected", rejected === 400);

const unauth = await page.evaluate(async () => {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({}),
  });
  return response.status;
});
check("writes require a session", unauth === 401 || unauth === 400);

// --- delete ------------------------------------------------------------
page.on("dialog", (dialog) => dialog.accept());
await page.locator('button[aria-label^="Delete Smoke Test Studio"]').first().click();
await page.waitForTimeout(2500);
check(
  "delete removes the project",
  (await page.locator("h3", { hasText: "Smoke Test Studio" }).count()) === 0,
);

const gone = await browser.newPage();
await gone.goto(`${BASE}/`, { waitUntil: "networkidle" });
check(
  "deleted project is gone from the public site",
  (await gone.locator("text=Smoke Test Studio").count()) === 0,
);
await gone.close();

await browser.close();

console.log(fails.length === 0 ? "\nALL PASS" : `\n${fails.length} FAILED`);
process.exit(fails.length === 0 ? 0 : 1);
