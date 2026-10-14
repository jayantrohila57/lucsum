/**
 * Visual QA: full-page screenshots at mobile / tablet / desktop.
 * Run after `pnpm build && pnpm start`.
 * Usage: node scripts/qa-ui-screenshots.mjs [--base http://localhost:3000] [--out docs/qa-screenshots]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3000";
const outDir = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "docs/qa-screenshots";

const products = JSON.parse(readFileSync("data/shopify-export/products.json", "utf8"))
  .data.products.nodes.filter((n) => n.status === "ACTIVE")
  .map((n) => n.handle);

const routes = [
  { slug: "home", path: "/" },
  { slug: "shop", path: "/shop" },
  { slug: "shop-filter", path: "/shop?style=celestial-graphic" },
  { slug: "pdp", path: `/products/${products[0]}` },
  { slug: "help", path: "/help" },
  { slug: "cart", path: "/cart" },
  { slug: "checkout", path: "/checkout" },
  { slug: "legal", path: "/legal" },
  { slug: "legal-shipping", path: "/legal/shipping-policy" },
  { slug: "auth-sign-in", path: "/auth/sign-in" },
];

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "desktop", width: 1280, height: 900 },
];

async function measureUi(page) {
  return page.evaluate(() => {
    const radiusOff = [];
    const borderMix = [];
    const cards = document.querySelectorAll("[data-slot='card'], .box-card, a[class*='border']");
    cards.forEach((el, i) => {
      if (i > 24) return;
      const cs = getComputedStyle(el);
      const br = parseFloat(cs.borderTopLeftRadius) || 0;
      if (br > 0.5) radiusOff.push({ tag: el.tagName, br, className: el.className?.slice?.(0, 80) });
    });
    const bordered = [...document.querySelectorAll("*")].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.borderTopWidth !== "0px" && el.children.length > 0 && el.offsetWidth > 100;
    });
    for (const el of bordered.slice(0, 40)) {
      for (const child of el.children) {
        const pcs = getComputedStyle(el);
        const ccs = getComputedStyle(child);
        if (pcs.borderTopWidth !== "0px" && ccs.borderTopWidth !== "0px") {
          borderMix.push({
            parent: el.tagName + (el.className ? `.${String(el.className).split(" ")[0]}` : ""),
            child: child.tagName + (child.className ? `.${String(child.className).split(" ")[0]}` : ""),
          });
          break;
        }
      }
    }
    return {
      roundedElements: radiusOff.length,
      radiusSamples: radiusOff.slice(0, 5),
      possibleDoubleBorders: borderMix.slice(0, 8),
    };
  });
}

mkdirSync(outDir, { recursive: true });
const report = { base, at: new Date().toISOString(), pages: [] };

const browser = await chromium.launch({ headless: true });
for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  for (const route of routes) {
    const url = `${base}${route.path}`;
    await page
      .goto(url, { waitUntil: "networkidle", timeout: 60000 })
      .catch(() => page.goto(url, { waitUntil: "domcontentloaded" }));
    await page.waitForTimeout(400);
    const file = `${route.slug}--${vp.name}.png`;
    const filePath = join(outDir, file);
    await page.screenshot({ path: filePath, fullPage: true });
    const metrics = await measureUi(page);
    report.pages.push({ route: route.slug, path: route.path, viewport: vp.name, screenshot: file, metrics });
  }
  await context.close();
}
await browser.close();

writeFileSync(join(outDir, "ui-metrics.json"), JSON.stringify(report, null, 2));
console.log(`Wrote ${report.pages.length} screenshots to ${outDir}/`);
