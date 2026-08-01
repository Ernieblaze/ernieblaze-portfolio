import { chromium } from "playwright";
const BASE = process.env.BASE || "http://localhost:3117";
const b = await chromium.launch();
const fails = [];
const check = (l, ok) => { console.log((ok?"PASS":"FAIL")+"  "+l); if(!ok) fails.push(l); };

// 1. Device preference is followed with no stored choice
for (const [scheme, expected] of [["dark","dark"],["light","light"]]) {
  const p = await b.newPage({ colorScheme: scheme });
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  const t = await p.evaluate(() => document.documentElement.getAttribute("data-theme"));
  check(`device set to ${scheme} -> site renders ${t}`, t === expected);
  await p.close();
}

// 2. Toggle flips, persists, and survives reload
const p = await b.newPage({ colorScheme: "dark" });
await p.goto(BASE, { waitUntil: "networkidle" });
const before = await p.evaluate(() => document.documentElement.getAttribute("data-theme"));
await p.click('button[aria-label*="Switch to"]');
await p.waitForTimeout(500);
const after = await p.evaluate(() => document.documentElement.getAttribute("data-theme"));
check(`toggle flips ${before} -> ${after}`, before !== after);
const stored = await p.evaluate(() => localStorage.getItem("eb-theme"));
check(`choice stored as "${stored}"`, stored === after);
await p.reload({ waitUntil: "domcontentloaded" });
const afterReload = await p.evaluate(() => document.documentElement.getAttribute("data-theme"));
check("survives reload", afterReload === after);

// 3. Explicit choice beats the device setting
check("explicit choice overrides device dark", afterReload === "light");

// 4. No flash: theme is applied before first paint
const html = await (await fetch(BASE)).text();
check("theme script is inlined in <head>", html.includes("data-theme") && html.indexOf("data-theme") < html.indexOf("</head>"));

// 5. Reduced motion still renders the hero
const rm = await b.newPage({ reducedMotion: "reduce" });
await rm.goto(BASE, { waitUntil: "networkidle" });
await rm.waitForTimeout(1200);
const heroVisible = await rm.locator("h1").isVisible();
check("hero renders with reduced motion", heroVisible);
await rm.close();

await b.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");
process.exit(fails.length ? 1 : 0);
