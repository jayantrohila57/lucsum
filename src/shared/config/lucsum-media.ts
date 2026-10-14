/**
 * Product imagery from the committed Shopify export (data/shopify-export/products.json).
 * Used where we need static LUCSUM assets without DB rows.
 */
export const LUCSUM_SHOPIFY_CDN = {
  heroCelestialFront:
    "https://cdn.shopify.com/s/files/1/0805/8847/2420/files/celestial-graphic-front_294cc928-a833-4c28-9752-40e945701bdc.png?v=1789242158",
  celestialLifestyle:
    "https://cdn.shopify.com/s/files/1/0805/8847/2420/files/celestial-graphic-black-06-lifestyle.png?v=1791802734",
  contrastPanelFront:
    "https://cdn.shopify.com/s/files/1/0805/8847/2420/files/contrast-panel-black-front_655318af-89b7-4f54-803a-087f407aaa6b.png?v=1789242172",
  contrastPanelCollage:
    "https://cdn.shopify.com/s/files/1/0805/8847/2420/files/contrast-panel-black-collage_117447a1-8dd5-44c1-a6c8-a0b900ff070c.png?v=1789242173",
  contrastPanelWhite:
    "https://cdn.shopify.com/s/files/1/0805/8847/2420/files/contrast-panel-white-front_877d38a2-ede6-4471-84a8-bef67171aa10.png?v=1789242172",
} as const;

/** Auth panel collage — all from Shopify product media in the export bundle. */
export const LUCSUM_AUTH_GALLERY_IMAGES: readonly string[] = [
  LUCSUM_SHOPIFY_CDN.celestialLifestyle,
  LUCSUM_SHOPIFY_CDN.heroCelestialFront,
  LUCSUM_SHOPIFY_CDN.contrastPanelFront,
  LUCSUM_SHOPIFY_CDN.contrastPanelCollage,
  LUCSUM_SHOPIFY_CDN.contrastPanelWhite,
];
