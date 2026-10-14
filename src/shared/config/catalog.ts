/** LUCSUM catalogue roots from Shopify import — @see docs/SHOPIFY_IMPORT.md */
export const LUCSUM_CATALOG_CATEGORY_SLUGS = ["t-shirts", "collections"] as const;

export function isLucsumCatalogCategorySlug(slug: string): boolean {
  return (LUCSUM_CATALOG_CATEGORY_SLUGS as readonly string[]).includes(slug);
}
