/** Small-catalog LUCSUM storefront (25 tees). Prefer flags over deleting core modules. */
export const STOREFRONT_SIMPLIFIED = true;

export const storefrontFeatures = {
  /** Single shop grid; hide category tree UX */
  simplifiedShop: STOREFRONT_SIMPLIFIED,
  /** Core public site: /, /shop, /products/[slug], essentials only */
  minimalPublicSite: STOREFRONT_SIMPLIFIED,
  showWishlist: !STOREFRONT_SIMPLIFIED,
  showCompare: false,
  showMarketingBlocks: !STOREFRONT_SIMPLIFIED,
  showNewsletterPromo: !STOREFRONT_SIMPLIFIED,
  /** Journal omitted from nav/sitemap unless articles exist in DB */
  blogEnabled: false,
  studioSlimNav: STOREFRONT_SIMPLIFIED,
} as const;

export const LUCSUM_STYLE_LABELS: Record<string, string> = {
  "branded-tape": "Branded Tape",
  "contrast-panel": "Contrast Panel",
  "celestial-graphic": "Celestial Graphic",
  "shoulder-logo": "Shoulder Logo",
  "raglan-baseball": "Raglan Baseball",
};

/** Verified facts for trust strip (from Shopify backup / site copy — no invented promos). */
export const LUCSUM_TRUST_FACTS = [
  "25 colourways across 5 oversized styles",
  "Sizes S–XXL · 100% cotton jersey",
  "Shipped across India · COD available",
  "Secure checkout via Razorpay (UPI & cards)",
] as const;
