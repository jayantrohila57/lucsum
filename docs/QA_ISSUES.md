# Production QA issues (minimal storefront)

**Run:** `pnpm build && pnpm start` on port 3000  
**Data:** Shopify backup seed (25 active products)  
**Automation:** `node scripts/qa-production-pages.mjs` → `docs/qa-production-results.json`  
**UI screenshots:** `node scripts/qa-ui-screenshots.mjs` → `docs/qa-screenshots/after/` (mobile 390, tablet 834, desktop 1280)  
**Viewports:** Desktop 1280×900, Mobile iPhone 13 (functional QA); UI pass adds tablet 834  
**Date:** 2026-10-14 (UI box system pass: same date)  
**Site map:** [SITE_MAP.md](./SITE_MAP.md)

## Summary

| Area | Desktop | Mobile | Notes |
|------|---------|--------|-------|
| In-scope pages (/, /shop, 25 PDPs, help, cart, checkout, legal core) | 200 | 200 | No placeholder/demo copy detected |
| Legacy + Shopify sample redirects | OK | OK | All sampled chains `redirectOk: true` |
| Auth / account (unauthenticated) | 200 → sign-in | 200 → sign-in | Expected |
| Studio (unauthenticated) | 200 → `/` | 200 → `/` | Expected |
| API health | 200 | 200 | — |

**Confirmed defects (fix in step 4):** 4 high/medium functional issues below.  
**False positives / test noise:** broken-image heuristic, `cart.get` failed fetch during fast navigation, mobile `AbortError: Transition was skipped`, HTTP 429 during rapid mobile legal-page sweep.

---

## Severity legend

| Level | Meaning |
|-------|---------|
| **P0** | Blocks purchase or confirmation for guests |
| **P1** | Wrong URL/UX in minimal scope; console errors in prod |
| **P2** | Polish, SEO, or out-of-scope surfacing |
| **P3** | Informational / test artifact |

---

## `/checkout/confirmation`

### P0 — Guest cannot view order confirmation after checkout — **fixed on `cursor/ui-box-system-8d38`**

- **GitHub:** [#45](https://github.com/jayantrohila57/lucsum/issues/45)
- **Was:** Session required before `order.get`.
- **Fix:** Render confirmation from `orderId` without sign-in gate (re-test with paid test order).

### P3 — Missing `orderId` redirects to `/shop`

- **Observed:** `GET /checkout/confirmation` → final URL `/shop` (200).
- **Assessment:** Acceptable fallback; could redirect to `/checkout` with a flash message.

---

## `/checkout/pay`

### P1 — React hydration error #418 when visiting without `orderId`

- **GitHub:** [#46](https://github.com/jayantrohila57/lucsum/issues/46)
- **Observed:** Desktop: navigate to `/checkout/pay` → ends on `/checkout` but `pageErrors` includes minified React #418 (text hydration mismatch) during redirect transition.
- **Code:** Server `redirect(PATH.CHECKOUT.ROOT)` when `!orderId` (`checkout/pay/page.tsx`).
- **Expected:** Clean redirect with no client hydration error.

---

## `/products/[slug]` (all 25 PDPs)

### P1 — “At a glance” still links to legacy `/store/...` URLs

- **GitHub:** [#47](https://github.com/jayantrohila57/lucsum/issues/47)
- **Observed:** Breadcrumbs use `/shop` in minimal mode, but **Category** / **Collection** in “At a glance” still use `PATH.STORE.CATEGORIES` and `PATH.STORE.SUB_CATEGORIES` (`product-pdp.tsx` ~386–399).
- **Impact:** Extra 301 hop to `/shop` or legacy store tree; inconsistent with 4-page scope.
- **Expected:** Link to `/shop?style={styleSlug}` or static labels without legacy paths.

### P3 — Intermittent `cart.get` / `review.getMany` network errors (automation)

- **Observed:** Some PDP loads log tRPC “Failed to fetch” / “network error” when tests navigate quickly.
- **Assessment:** Likely race under parallel QA; re-check manually after fixes.

---

## `/` (landing)

### P3 — “Broken images” in QA JSON (false positive)

- **Observed:** `brokenImages` lists many `/_next/image?url=cdn.shopify.com...` on `/` and `/shop`.
- **Cause:** Playwright checks `naturalWidth === 0` after 800ms; lazy-loaded images often not decoded yet.
- **Manual:** Images load from Shopify CDN in browser.

---

## `/cart`, `/checkout`

### P2 — Empty-state “Continue shopping” uses `PATH.STORE.ROOT`

- **GitHub:** [#48](https://github.com/jayantrohila57/lucsum/issues/48)
- **Files:** `cart-review-section.tsx`, `order-list.tsx`, `shipment-list.tsx`, `payment-list.tsx`, `wishlist-item-list.tsx`, etc.
- **Impact:** Works via 301 to `/shop` but wrong canonical path and extra redirect.

---

## `/orders/[id]`

### P1 — Guests always sent to sign-in

- **GitHub:** [#49](https://github.com/jayantrohila57/lucsum/issues/49)
- **Observed:** `GET /orders/00000000-…` → `/auth/sign-in?callbackUrl=…`
- **Assessment:** May be intentional; conflicts with “guest checkout + email confirmation only” unless magic-link or order token is added.

---

## Footer (all pages)

### P2 — RSS affordance still visible in minimal mode

- **GitHub:** [#50](https://github.com/jayantrohila57/lucsum/issues/50)
- **Observed:** `<RSS />` always rendered in footer (`footer.tsx`); `/rss.xml` returns 200 (out of scope per site map).
- **Expected:** Hide RSS in `minimalPublicSite` or redirect feed to sitemap-only.

---

## `/legal/*` (extra policies)

### P2 — Out-of-scope policies still reachable

- **Scope:** `refund-policy`, `cookies-policy`, `user-agreement`, `data-protection` marked **REMOVE\*** in site map.
- **Observed:** 200 on direct URL (desktop). Not linked from minimal footer.
- **Expected:** 301 to `/legal` or keep for compliance only (product decision).

---

## `/studio/*` (admin)

### P3 — Unauthenticated studio URLs redirect to `/`

- **Observed:** `/studio`, `/studio/catalog/products`, `/studio/inventory`, `/studio/orders` → `/`.
- **Assessment:** Expected without staff session; not a storefront defect.

---

## Redirects (legacy + Shopify)

### No issues filed

- **Sampled:** `/store`, `/store/categories`, PDP legacy path, `/marketing/about`, `/support/faq`, `/blog/test-post`, `/account/wishlist`, 12 Shopify rules from `data/shopify-redirects.json`.
- **Result:** All `redirectOk: true` in `qa-production-results.json`.

---

## UI / box system (Jayant)

**Goal:** One border width/colour, `--radius: 0`, shadcn spacing (`p-6` cards, `gap-4`/`gap-6` grids, container `px-4 sm:px-6 lg:px-8`). Primitives: `Container`, `PageSection`, `BoxCard`, `BorderedGrid` in `src/shared/components/layout/box/`.

### Audit findings (pre-fix — code + visual review)

| Page / area | Issue | Severity | Screenshot (post-fix verify) |
|-------------|--------|----------|----------------------------|
| **Global `Card`** | `rounded-xl` + `ring-1` conflicted with `--radius: 0` box language | P1 | `after/home--desktop.png` |
| **`/` featured + shop-by-style** | Mixed `gap-4` loose grids vs section `border-t` shell; rounded product tiles | P1 | `after/home--mobile.png`, `after/home--tablet.png` |
| **`/shop` grid + filters** | Filter bar `rounded-lg`; product cards separate borders (double-line risk) | P1 | `after/shop--desktop.png` |
| **`/shop` skeleton** | `rounded-lg` skeletons mismatched loading state | P2 | `after/shop--mobile.png` |
| **`/products/*` PDP** | Ad-hoc `max-w-7xl px-*`; specs `rounded-lg`; “At a glance” spacing | P1 | `after/pdp--desktop.png` |
| **`/help`** | `max-w-3xl` without shared container; `gap-16` vs section scale | P2 | `after/help--tablet.png` |
| **Hero carousel** | `rounded-lg` slide frame | P2 | `after/home--desktop.png` |
| **Footer** | Payment chips `rounded-md`; RSS visible in minimal mode | P2 | `after/home--mobile.png` |
| **`/cart` summary** | `rounded-lg` + duplicate border classes | P2 | `after/cart--desktop.png` |
| **Checkout empty CTA** | “Continue shopping” → `/store` (extra redirect) | P2 | `after/checkout--mobile.png` |

**Post-fix metrics:** `docs/qa-screenshots/after/ui-metrics.json` — sampled cards on core routes report `roundedElements: 0` and no `possibleDoubleBorders` heuristics on home/shop/pdp (mobile/tablet/desktop).

**GitHub:** [#52](https://github.com/jayantrohila57/lucsum/issues/52) (umbrella UI systemization)

**Remaining / follow-up:** Studio and legacy `/store/*` pages not fully migrated to `BorderedGrid`; account auth cards; dense shadcn overlays (menus) still use internal radius for accessibility — acceptable off-storefront.

### Functional fixes bundled in UI branch

- **#45** Guest confirmation: auth gate removed on `checkout/confirmation` (verify with real `orderId`).
- **#47** PDP “At a glance” links → `/shop?style=…` in minimal mode.
- **#48** Continue shopping → `/shop` when `minimalPublicSite`.
- **#50** RSS footer hidden when `minimalPublicSite`.

---

## Layout / shadcn (legacy note)

Superseded by UI / box system section above for storefront pages.

---

## Issue tracker mapping

| # | Title |
|---|--------|
| [#45](https://github.com/jayantrohila57/lucsum/issues/45) | P0: Guest checkout confirmation requires sign-in |
| [#46](https://github.com/jayantrohila57/lucsum/issues/46) | P1: Hydration error #418 on `/checkout/pay` without orderId |
| [#47](https://github.com/jayantrohila57/lucsum/issues/47) | P1: PDP At a glance legacy `/store` links |
| [#48](https://github.com/jayantrohila57/lucsum/issues/48) | P2: Continue shopping → `/store` instead of `/shop` |
| [#49](https://github.com/jayantrohila57/lucsum/issues/49) | P1: Guest `/orders/[id]` requires sign-in |
| [#50](https://github.com/jayantrohila57/lucsum/issues/50) | P2: RSS footer in minimal mode |
| [#52](https://github.com/jayantrohila57/lucsum/issues/52) | P1: Systematize box UI (tokens + layout primitives + page audit) |
