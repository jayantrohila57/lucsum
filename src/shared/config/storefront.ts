/** Small-catalog LUCSUM storefront (25 tees). Prefer flags over deleting core modules. */
export const STOREFRONT_SIMPLIFIED = true;

export const storefrontFeatures = {
  /** Single /store grid; hide category tree UX */
  simplifiedShop: STOREFRONT_SIMPLIFIED,
  showWishlist: !STOREFRONT_SIMPLIFIED,
  showCompare: false,
  showMarketingBlocks: !STOREFRONT_SIMPLIFIED,
  showNewsletterPromo: !STOREFRONT_SIMPLIFIED,
  /** Journal routes stay available when articles exist; omitted from primary nav */
  blogEnabled: true,
  studioSlimNav: STOREFRONT_SIMPLIFIED,
} as const;

export const LUCSUM_STYLE_LABELS: Record<string, string> = {
  "branded-tape": "Branded Tape",
  "contrast-panel": "Contrast Panel",
  "celestial-graphic": "Celestial Graphic",
  "shoulder-logo": "Shoulder Logo",
  "raglan-baseball": "Raglan Baseball",
};

/** Curated collection PLPs (Shopify backup handles under /store/collections/) */
export const LUCSUM_NAV_COLLECTIONS = [
  { slug: "new-arrivals", title: "New Arrivals" },
  { slug: "graphic-tees", title: "Graphic Tees" },
  { slug: "lucsum-essentials", title: "Essentials" },
  { slug: "black-t-shirts", title: "Black Tees" },
] as const;

/** Verified facts for trust strip (from Shopify backup / site copy — no invented promos). */
export const LUCSUM_TRUST_FACTS = [
  "25 colourways across 5 oversized styles",
  "Sizes S–XXL · 100% cotton jersey",
  "Shipped across India · COD available",
  "Secure checkout via Razorpay (UPI & cards)",
] as const;
