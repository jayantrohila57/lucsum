# LUCSUM site map (complete URL tree)

**Scope legend (4-page minimal storefront)**

| Status | Meaning |
|--------|---------|
| **KEEP** | In-scope customer URL (landing, shop, PDP, or essential) |
| **KEEP (auth)** | Auth required but part of checkout/account essentials |
| **REDIRECT** | Legacy URL; 301 to KEEP target (middleware or `next.config`) |
| **REMOVE** | Out of scope; should not appear in nav/sitemap (route may still exist) |
| **ADMIN** | Studio / staff only (`STOREFRONT_SIMPLIFIED` slim nav: products, inventory, orders) |
| **API** | Machine endpoints |
| **META** | Feeds / SEO artifacts |

Flag: `STOREFRONT_SIMPLIFIED = true` in `src/shared/config/storefront.ts`.

---

## Customer (in scope)

```
/                                    KEEP     Landing — hero, featured grid, shop-by-style, trust strip
/shop                                KEEP     All 25 colourways; filters: style, colour, size
/shop?style={styleSlug}              KEEP     Style filter (query)
/products/{productSlug}              KEEP     PDP (25 slugs from Shopify handles)
/help                                KEEP     Combined About + FAQ + Contact (#about, #faq, #contact)
/cart                                KEEP     Guest cart
/checkout                            KEEP     Guest checkout (address + shipping)
/checkout/pay?orderId=               KEEP     Razorpay payment step
/checkout/confirmation?orderId=      KEEP     Order confirmation (see QA: auth gate)
/orders/{id}                         KEEP     Order detail + tracking (auth required today)
/legal                               KEEP     Policy index
/legal/terms-of-service              KEEP     Terms
/legal/privacy-policy                KEEP     Privacy
/legal/shipping-policy               KEEP     Shipping policy
/legal/return-policy                 KEEP     Returns policy
/legal/refund-policy                 REMOVE*  Extra policy (redirect or footer-only)
/legal/cookies-policy                REMOVE*
/legal/user-agreement                REMOVE*
/legal/data-protection               REMOVE*
/legal/licenses                      REMOVE*
```

\*Still reachable by direct URL; omitted from minimal sitemap.

---

## Customer (legacy — redirect, not in nav)

```
/store                               REDIRECT → /shop
/store/categories                    REDIRECT → /shop
/store/t-shirts/{style}              REDIRECT → /shop?style={style}
/store/t-shirts/{style}/{product}    REDIRECT → /products/{product}
/store/collections/*                 REDIRECT → /shop
/store/checkout/*                    REDIRECT → /checkout/*
/store/order/{id}                    REDIRECT → /orders/{id}
/marketing/about                     REDIRECT → /help#about
/marketing/newsletter                REDIRECT → /help#contact
/support                             REDIRECT → /help
/support/contact                     REDIRECT → /help#contact
/support/faq                         REDIRECT → /help#faq
/support/help-center                 REDIRECT → /help#faq
/support/shipping                    REDIRECT → /legal/shipping-policy
/support/returns                     REDIRECT → /legal/return-policy
/support/size-guide                  REDIRECT → /help#faq
/support/tickets/*                   REDIRECT → /help#contact
/blog                                REDIRECT → /
/blog/{slug}                         REDIRECT → /
/account/wishlist                    REDIRECT → /shop
```

Legacy **App Router pages still exist** under `src/app/(site)/store/**`, `marketing/**`, `support/**`, `blog/**` but are not linked when simplified.

---

## Auth

```
/auth                                KEEP (auth)  Auth hub
/auth/sign-in                        KEEP (auth)  Sign in (callbackUrl support)
/auth/sign-up                        KEEP (auth)  Sign up
/auth/forgot-password                KEEP (auth)  Password reset request
/auth/reset-password                 KEEP (auth)  Password reset confirm
/auth/verify-email                   KEEP (auth)  Email verification
```

---

## Account (optional — orders + addresses per scope)

```
/account                             KEEP (auth)  Profile / settings hub
/account/order                       KEEP (auth)  Order list
/account/order/{id}                  KEEP (auth)  Order detail
/account/order/{id}/invoice          REMOVE*      Invoice PDF/view
/account/address                     KEEP (auth)  Address book
/account/address/new                 KEEP (auth)  New address
/account/address/{id}/edit           KEEP (auth)  Edit address
/account/setting                     REMOVE*      Settings (partial overlap with profile)
/account/setting/privacy             REMOVE*
/account/cart                        REMOVE*      Duplicate of /cart
/account/wishlist                    REDIRECT → /shop
/account/payment                     REMOVE*
/account/shipment                    REMOVE*
/account/shipment/{id}               REMOVE*
/account/review                      REMOVE*
```

Sidebar hides several items when simplified; routes remain reachable if signed in.

---

## Studio (admin — staff auth)

```
/studio                              ADMIN    Dashboard
/studio/catalog                      ADMIN    Catalog hub
/studio/catalog/products             ADMIN    Product list (KEEP slim nav)
/studio/catalog/products/add-new-product
/studio/catalog/products/{productSlug}
/studio/catalog/products/{productSlug}/edit-product
/studio/catalog/products/{productSlug}/add-new-variant
/studio/catalog/products/{productSlug}/{variantSlug}
/studio/catalog/products/{productSlug}/{variantSlug}/edit-variant
/studio/catalog/categories/**        ADMIN    Category tree (REMOVE from slim nav)
/studio/catalog/attributes/**        ADMIN    Attributes (REMOVE from slim nav)
/studio/inventory/**                  ADMIN    Stock (KEEP slim nav)
/studio/orders                       ADMIN    Orders (KEEP slim nav)
/studio/orders/{orderId}             ADMIN    Order detail
/studio/users/**                     ADMIN    Customers/staff (REMOVE from slim nav)
/studio/payment/**                   ADMIN    Payments (REMOVE from slim nav)
/studio/shipping/**                  ADMIN    Shipping config (REMOVE from slim nav)
/studio/reviews                      ADMIN    Reviews (REMOVE from slim nav)
/studio/discounts/**                 ADMIN    Discounts (REMOVE from slim nav)
/studio/marketing/**                 ADMIN    Marketing CMS (REMOVE from slim nav)
/studio/[...catchAll]                ADMIN    Studio 404
```

---

## API & webhooks

```
/api/health                          API      Liveness
/api/health/ready                    API      Readiness (DB)
/api/auth/[...all]                   API      Better Auth handlers
/api/v1/[[...rest]]                  API      tRPC / REST bridge
/api/order                           API      Order API
/api/payments/razorpay/callback      API      Razorpay return URL
/api/webhooks/razorpay               API      Razorpay webhooks
/api/blob/upload                     API      Uploads (auth)
```

---

## Meta / static

```
/sitemap.xml                         META     Minimal static + /products/*
/robots.txt                          META     Crawl rules
/rss.xml                             REMOVE   Blog RSS (blog out of scope)
/manifest.webmanifest                META     PWA manifest
/opengraph-image                     META     OG image
/icon.png                            META     Favicon
/sentry-example-page                 REMOVE   Dev/demo page
/forbidden                           REMOVE   Error page
```

---

## Shopify redirect map (`data/shopify-redirects.json`)

Loaded in `next.config.ts` (destinations modernized; self-`/products/*` rules dropped). **39 rules** — samples:

| Source | Destination | Type |
|--------|-------------|------|
| `/collections/t-shirts` | `/shop` | 301 |
| `/collections/new-arrivals` | `/shop` | 301 |
| `/collections/branded-tape` | `/shop?style=branded-tape` | 301 |
| `/collections/celestial-graphic` | `/shop?style=celestial-graphic` | 301 |
| `/collections/red-t-shirts` | `/shop` | 301 |
| `/pages/about` | `/help#about` or `/marketing/about` → `/help#about` | 301 |
| `/pages/contact` | `/support/contact` → `/help#contact` | 301 |
| `/policies/privacy-policy` | `/legal/privacy-policy` | 301 |

Full list: see `data/shopify-redirects.json` in repo (regenerated by `scripts/shopify-import.ts`).

---

## Middleware redirects (`src/middleware.ts`)

Same targets as legacy table above for `/store`, `/marketing`, `/support`, `/blog`, `/account/wishlist`. Runs only when `STOREFRONT_SIMPLIFIED` is true.

---

## Product PDP slugs (25)

```
/products/celestial-graphic-black
/products/shoulder-logo-charcoal
/products/branded-tape-black
… (22 more — see data/shopify-export/products.json ACTIVE handles)
```

---

*Generated for Jayant QA process. Production audit: `docs/qa-production-results.json` (2026-10-14, `pnpm build && pnpm start`).*
