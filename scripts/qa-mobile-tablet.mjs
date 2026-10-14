/**
 * Mobile & tablet QA (Jayant priority widths).
 * Run after `pnpm build && pnpm start`.
 *
 * Usage: node scripts/qa-mobile-tablet.mjs [--base http://localhost:3000]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3000";

const outDir = "docs/qa-screenshots/mobile-tablet";
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { group: "mobile", width: 360, height: 800 },
  { group: "mobile", width: 390, height: 844 },
  { group: "mobile", width: 430, height: 932 },
  { group: "tablet", width: 768, height: 1024 },
  { group: "tablet", width: 1024, height: 1366 },
];

const products = JSON.parse(readFileSync("data/shopify-export/products.json", "utf8"))
  .data.products.nodes.filter((n) => n.status === "ACTIVE")
  .map((n) => n.handle);

const legalCore = ["terms-of-service", "privacy-policy", "shipping-policy", "return-policy"];

const routes = [
  { slug: "home", path: "/" },
  { slug: "shop", path: "/shop", interact: "shop" },
  { slug: "shop-filter", path: "/shop?style=celestial-graphic", interact: "shop" },
  ...products.map((h) => ({
    slug: `pdp-${h}`,
    path: `/products/${h}`,
    interact: h === products[0] ? "pdp" : undefined,
  })),
  { slug: "help", path: "/help" },
  { slug: "cart", path: "/cart" },
  { slug: "checkout", path: "/checkout", interact: "checkout" },
  { slug: "checkout-pay", path: "/checkout/pay" },
  { slug: "legal", path: "/legal" },
  ...legalCore.map((s) => ({ slug: `legal-${s}`, path: `/legal/${s}` })),
  { slug: "auth-sign-in", path: "/auth/sign-in" },
  { slug: "auth-sign-up", path: "/auth/sign-up" },
];

function slugFile(parts) {
  return parts
    .filter(Boolean)
    .join("--")
    .replace(/[^a-z0-9-]+/gi, "-")
    .slice(0, 120);
}

async function auditPage(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const excess = doc.scrollWidth - doc.clientWidth;
    let userScrollableX = false;
    if (excess > 1) {
      const before = window.scrollX;
      window.scrollBy(80, 0);
      userScrollableX = window.scrollX !== before;
      window.scrollTo(0, window.scrollY);
    }
    const overflowX = userScrollableX ? excess : 0;
    const issues = [];

    if (overflowX > 1) {
      const offenders = [];
      for (const el of document.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.right > window.innerWidth + 1 || r.left < -1) {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && String(el.className).split(" ")[0]) || "";
          offenders.push(`${tag}${cls ? `.${cls}` : ""} right=${Math.round(r.right)} vw=${window.innerWidth}`);
          if (offenders.length >= 6) break;
        }
      }
      issues.push({ code: "horizontal-overflow", detail: `scrollWidth excess ${overflowX}px`, offenders });
    }

    const smallTargets = [];
    for (const el of document.querySelectorAll("button, a[href], [role='button']")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.width < 44 || r.height < 44) {
        const label = el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 40) || el.tagName;
        smallTargets.push({ label, w: Math.round(r.width), h: Math.round(r.height) });
        if (smallTargets.length >= 12) break;
      }
    }
    if (smallTargets.length) {
      issues.push({
        code: "small-tap-target",
        detail: `${smallTargets.length}+ controls under 44px`,
        samples: smallTargets.slice(0, 6),
      });
    }

    const header = document.querySelector("header");
    let headerInfo = null;
    if (header) {
      const cs = getComputedStyle(header);
      const r = header.getBoundingClientRect();
      headerInfo = { position: cs.position, top: Math.round(r.top), height: Math.round(r.height) };
    }

    const main = document.querySelector("main");
    const mainPad = main ? getComputedStyle(main).paddingTop : null;

    const bordered = document.querySelector("[data-slot='box-card'], [data-slot='card'], .box-card, .BorderedGrid");
    let edgeGap = null;
    if (bordered) {
      const r = bordered.getBoundingClientRect();
      edgeGap = { left: Math.round(r.left), rightGap: Math.round(window.innerWidth - r.right) };
    }

    return { overflowX, issues, headerInfo, mainPad, edgeGap, innerWidth: window.innerWidth };
  });
}

async function afterScrollHeader(page) {
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(200);
  return page.evaluate(() => {
    const header = document.querySelector("header");
    if (!header) return { ok: false, reason: "no header" };
    const r = header.getBoundingClientRect();
    const cs = getComputedStyle(header);
    const stickyOk = (cs.position === "fixed" || cs.position === "sticky") && r.top <= 4;
    return { stickyOk, position: cs.position, top: Math.round(r.top) };
  });
}

async function interactShop(page, width) {
  const notes = [];
  if (width >= 768) return { notes, openedDrawer: false };

  try {
    const menuBtn = page.getByRole("button", { name: "Open menu" });
    await menuBtn.click({ timeout: 3000 });
    await page.waitForTimeout(400);
    const sheet = page.locator('[data-slot="sheet-content"], [role="dialog"]');
    if (await sheet.count()) notes.push("mobile-nav-sheet-opened");
    else notes.push("mobile-nav-sheet-missing");
    await page.keyboard.press("Escape");
  } catch {
    notes.push("mobile-nav-open-failed");
  }

  const filterWide = await page.evaluate(() => {
    const label = [...document.querySelectorAll("label")].find((l) => l.textContent?.trim() === "Style");
    const bar = label?.closest("[data-slot='box-card'], .box-card, form, div");
    if (!bar) return null;
    const r = bar.getBoundingClientRect();
    return { w: r.width, vw: window.innerWidth };
  });
  if (filterWide) {
    if (filterWide.w > filterWide.vw + 1) notes.push("filters-wider-than-viewport");
    notes.push("filters-inline-no-drawer");
  }
  return { notes, openedDrawer: notes.includes("mobile-nav-sheet-opened") };
}

async function interactPdp(page) {
  const notes = [];
  const thumbs = page.locator('button[aria-label^="View image"]');
  const count = await thumbs.count();
  if (count > 1) {
    await thumbs.nth(1).click({ timeout: 5000 });
    await page.waitForTimeout(300);
    notes.push("gallery-thumb-clicked");
  } else {
    notes.push("gallery-single-image");
  }

  const sizeBtn = page.getByRole("button", { name: /^S$|^M$|^L$|^XL$|^XXL$/i }).first();
  if (await sizeBtn.isVisible().catch(() => false)) {
    const box = await sizeBtn.boundingBox();
    if (box && (box.width < 44 || box.height < 44)) notes.push("size-chip-under-44px");
    await sizeBtn.click({ timeout: 3000 }).catch(() => notes.push("size-click-failed"));
  } else {
    notes.push("size-selector-not-found");
  }

  const galleryMain = page.locator(".aspect-square").first();
  const galBox = await galleryMain.boundingBox().catch(() => null);
  if (galBox && galBox.width > 430) notes.push("gallery-full-bleed-ok");
  return notes;
}

async function interactCheckout(page) {
  const notes = [];
  const inputs = page.locator("input, select, textarea");
  const n = await inputs.count();
  notes.push(`form-fields-${n}`);
  for (let i = 0; i < Math.min(n, 8); i++) {
    const el = inputs.nth(i);
    const box = await el.boundingBox();
    if (box && box.width > 0 && box.height < 44) notes.push("input-height-under-44");
  }
  return notes;
}

const report = { base, at: new Date().toISOString(), viewports: VIEWPORTS.map((v) => v.width), issues: [], pages: [] };
const issueKeys = new Set();

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  for (const route of routes) {
    const url = `${base}${route.path}`;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(500);
    } catch (e) {
      report.pages.push({ ...route, viewport: vp.width, group: vp.group, error: String(e) });
      continue;
    }

    const audit = await auditPage(page);
    const scrollHeader = await afterScrollHeader(page);
    let interactNotes = [];

    if (route.interact === "shop") interactNotes = (await interactShop(page, vp.width)).notes;
    if (route.interact === "pdp") interactNotes = await interactPdp(page);
    if (route.interact === "checkout") interactNotes = await interactCheckout(page);

    await page.evaluate(() => window.scrollTo(0, 0));

    const pageIssues = [...audit.issues];
    if (scrollHeader.position && !scrollHeader.stickyOk && vp.group === "mobile") {
      pageIssues.push({
        code: "header-not-sticky",
        detail: `position=${scrollHeader.position} top=${scrollHeader.top} after scroll`,
      });
    }
    for (const n of interactNotes) {
      if (n.includes("under-44") || n === "filters-inline-no-drawer" || n === "mobile-nav-open-failed") {
        pageIssues.push({ code: "interaction", detail: n });
      }
    }

    const entry = {
      slug: route.slug,
      path: route.path,
      viewport: vp.width,
      group: vp.group,
      overflowX: audit.overflowX,
      header: audit.headerInfo,
      scrollHeader,
      mainPad: audit.mainPad,
      edgeGap: audit.edgeGap,
      interactNotes,
      issues: pageIssues,
    };
    report.pages.push(entry);

    for (const iss of pageIssues) {
      const key = `${iss.code}|${route.slug}|${vp.width}|${iss.detail?.slice?.(0, 40) ?? ""}`;
      if (issueKeys.has(key)) continue;
      issueKeys.add(key);
      const shot = slugFile([iss.code, route.slug, vp.width]);
      const shotPath = join(outDir, `${shot}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      report.issues.push({
        severity: iss.code === "horizontal-overflow" ? "P1" : iss.code === "small-tap-target" ? "P1" : "P2",
        code: iss.code,
        page: route.slug,
        path: route.path,
        viewport: vp.width,
        group: vp.group,
        detail: iss.detail,
        offenders: iss.offenders,
        samples: iss.samples,
        screenshot: `mobile-tablet/${shot}.png`,
      });
    }
  }
  await context.close();
}

await browser.close();

writeFileSync("docs/qa-mobile-tablet-results.json", JSON.stringify(report, null, 2));
console.log(`Mobile/tablet QA: ${report.issues.length} unique issues, ${report.pages.length} page×viewport runs`);
console.log(`Results: docs/qa-mobile-tablet-results.json`);
