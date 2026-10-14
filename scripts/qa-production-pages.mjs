/**
 * Production-build page QA (run after `pnpm build && pnpm start`).
 * Usage: node scripts/qa-production-pages.mjs [--base http://localhost:3000]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { chromium, devices } from "playwright";

const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3000";

const productHandles = readFileSync("/workspace/data/shopify-export/products.json", "utf8");
const products = JSON.parse(productHandles)
  .data.products.nodes.filter((n) => n.status === "ACTIVE")
  .map((n) => n.handle);

const legalSlugs = [
  "terms-of-service",
  "privacy-policy",
  "shipping-policy",
  "return-policy",
  "refund-policy",
  "cookies-policy",
  "user-agreement",
  "data-protection",
];

const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /picsum\.photos/i,
  /placeholder/i,
  /demo categor/i,
  /coming soon/i,
  /no categories available/i,
  /seed-marketing/i,
  /example\.com/i,
];

const publicRoutes = [
  { path: "/", name: "Landing", scope: "KEEP" },
  { path: "/shop", name: "Shop (all)", scope: "KEEP" },
  { path: "/shop?style=celestial-graphic", name: "Shop (style filter)", scope: "KEEP" },
  ...products.map((h) => ({ path: `/products/${h}`, name: `PDP ${h}`, scope: "KEEP" })),
  { path: "/help", name: "Help (about/faq/contact)", scope: "KEEP" },
  { path: "/cart", name: "Cart", scope: "KEEP" },
  { path: "/checkout", name: "Checkout", scope: "KEEP" },
  { path: "/checkout/pay", name: "Checkout pay (no orderId)", scope: "KEEP" },
  { path: "/checkout/confirmation", name: "Checkout confirmation (no orderId)", scope: "KEEP" },
  { path: "/legal", name: "Legal index", scope: "KEEP" },
  ...legalSlugs.map((s) => ({
    path: `/legal/${s}`,
    name: `Legal ${s}`,
    scope: s.match(/terms|privacy|shipping|return/) ? "KEEP" : "REMOVE*",
  })),
  { path: "/orders/00000000-0000-0000-0000-000000000099", name: "Order detail (guest)", scope: "KEEP" },
  { path: "/rss.xml", name: "RSS feed", scope: "REMOVE" },
  { path: "/sitemap.xml", name: "Sitemap", scope: "META" },
  { path: "/robots.txt", name: "Robots", scope: "META" },
];

const legacyRoutes = [
  { path: "/store", expectFinal: "/shop", scope: "REDIRECT" },
  { path: "/store/categories", expectFinal: "/shop", scope: "REDIRECT" },
  {
    path: "/store/t-shirts/celestial-graphic/celestial-graphic-black",
    expectFinal: "/products/celestial-graphic-black",
    scope: "REDIRECT",
  },
  { path: "/store/t-shirts/celestial-graphic", expectFinal: "/shop", scope: "REDIRECT" },
  { path: "/marketing/about", expectFinal: "/help", scope: "REDIRECT" },
  { path: "/support/faq", expectFinal: "/help", scope: "REDIRECT" },
  { path: "/blog/test-post", expectFinal: "/", scope: "REDIRECT" },
  { path: "/account/wishlist", expectFinal: "/shop", scope: "REDIRECT" },
];

const shopifySamples = JSON.parse(readFileSync("/workspace/data/shopify-redirects.json", "utf8"))
  .slice(0, 12)
  .map((r) => ({
    path: r.source,
    expectFinal: r.destination.split("#")[0],
    scope: "SHOPIFY_REDIRECT",
  }));

const authRoutes = [
  { path: "/auth/sign-in", name: "Sign in", scope: "AUTH" },
  { path: "/auth/sign-up", name: "Sign up", scope: "AUTH" },
  { path: "/auth/forgot-password", name: "Forgot password", scope: "AUTH" },
];

const accountRoutes = [
  { path: "/account", name: "Account home", scope: "OPTIONAL" },
  { path: "/account/order", name: "Account orders", scope: "OPTIONAL" },
  { path: "/account/address", name: "Account addresses", scope: "OPTIONAL" },
  { path: "/account/wishlist", name: "Wishlist (legacy URL)", scope: "REDIRECT" },
];

const studioRoutes = [
  { path: "/studio", name: "Studio home", scope: "ADMIN" },
  { path: "/studio/catalog/products", name: "Studio products", scope: "ADMIN" },
  { path: "/studio/inventory", name: "Studio inventory", scope: "ADMIN" },
  { path: "/studio/orders", name: "Studio orders", scope: "ADMIN" },
];

const apiRoutes = [
  { path: "/api/health", name: "Health", scope: "API" },
  { path: "/api/health/ready", name: "Health ready", scope: "API" },
];

async function checkStatus(path) {
  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location") };
}

async function auditPage(page, url, label) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  let response;
  try {
    response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  } catch (e) {
    return {
      label,
      url,
      ok: false,
      error: String(e),
      consoleErrors,
      pageErrors,
      brokenImages: [],
      placeholders: [],
    };
  }

  await page.waitForTimeout(800);

  const brokenImages = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")];
    return imgs
      .filter((img) => {
        const w = img.naturalWidth;
        const src = img.currentSrc || img.src || "";
        if (!src || src.startsWith("data:")) return false;
        return w === 0;
      })
      .map((img) => img.currentSrc || img.src)
      .slice(0, 10);
  });

  const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 8000) ?? "");
  const placeholders = PLACEHOLDER_PATTERNS.filter((re) => re.test(bodyText)).map((re) => re.source);

  return {
    label,
    url,
    ok: true,
    status: response?.status(),
    finalUrl: page.url(),
    consoleErrors: [...new Set(consoleErrors)].slice(0, 8),
    pageErrors: [...new Set(pageErrors)].slice(0, 5),
    brokenImages,
    placeholders,
  };
}

async function runViewport(name, contextOptions, routes, redirects) {
  const browser = await chromium.launch();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const results = [];

  for (const r of routes) {
    results.push(await auditPage(page, `${base}${r.path}`, r.name ?? r.path));
  }

  for (const r of redirects) {
    const chain = [];
    let path = r.path;
    for (let i = 0; i < 5; i++) {
      const { status, location } = await checkStatus(path);
      chain.push({ path, status, location });
      if (!location || status < 300 || status >= 400) break;
      const next = location.startsWith("http") ? new URL(location).pathname + new URL(location).search : location;
      path = next;
    }
    const finalPath = chain[chain.length - 1]?.location
      ? new URL(chain[chain.length - 1].location, base).pathname
      : path;
    const expect = r.expectFinal?.split("?")[0];
    results.push({
      label: `REDIRECT ${r.path}`,
      url: `${base}${r.path}`,
      ok: true,
      redirectChain: chain,
      finalPath,
      expectFinal: r.expectFinal,
      redirectOk: expect ? finalPath.startsWith(expect) || path.startsWith(expect) : true,
      scope: r.scope,
    });
  }

  await browser.close();
  return { viewport: name, results };
}

async function main() {
  const allPageRoutes = [...publicRoutes, ...authRoutes, ...accountRoutes, ...studioRoutes];
  const allRedirects = [...legacyRoutes, ...shopifySamples];

  const desktop = await runViewport("desktop", { viewport: { width: 1280, height: 900 } }, allPageRoutes, allRedirects);
  const mobile = await runViewport("mobile", devices["iPhone 13"], allPageRoutes, allRedirects);

  const apiResults = [];
  for (const r of apiRoutes) {
    const res = await fetch(`${base}${r.path}`);
    apiResults.push({ ...r, status: res.status, ok: res.ok });
  }

  const out = { base, at: new Date().toISOString(), desktop, mobile, api: apiResults };
  const outPath = "/workspace/docs/qa-production-results.json";
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
