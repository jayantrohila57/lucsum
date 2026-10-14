/** Shopify page handle → first-party route (from import). @see scripts/shopify-import.ts */
export const SHOPIFY_PAGE_ROUTE_BY_HANDLE: Record<string, string> = {
  about: "/marketing/about",
  contact: "/support/contact",
  shipping: "/support/shipping",
  faq: "/support/faq",
  "returns-refunds": "/support/returns",
  "size-fit": "/support/size-guide",
  "track-order": "/account/order",
  "care-guide": "/support/help-center",
  "why-lucsum": "/marketing/about",
};

export const APP_ROUTE_BY_SHOPIFY_PAGE_HANDLE = SHOPIFY_PAGE_ROUTE_BY_HANDLE;

/** App support/marketing path → `site_page.slug` */
export const SITE_PAGE_SLUG_BY_CANONICAL_PATH: Record<string, string> = {
  "/marketing/about": "about",
  "/support/contact": "contact",
  "/support/shipping": "shipping",
  "/support/faq": "faq",
  "/support/returns": "returns-refunds",
  "/support/size-guide": "size-fit",
  "/support/help-center": "care-guide",
};

export function sitePageSlugForLegalRoute(slug: string): string {
  return `policy-${slug}`;
}
