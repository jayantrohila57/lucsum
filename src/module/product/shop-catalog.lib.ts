import { PATH } from "@/shared/config/routes";
import { LUCSUM_STYLE_LABELS, storefrontFeatures } from "@/shared/config/storefront";
import { compareSizeAttributeValues } from "@/shared/utils/lib/breadcrumb-label";

export function colorLabelFromProductSlug(productSlug: string, styleSlug: string): string {
  const prefix = `${styleSlug}-`;
  const raw = productSlug.startsWith(prefix) ? productSlug.slice(prefix.length) : productSlug;
  return raw
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function styleTitle(styleSlug: string): string {
  return LUCSUM_STYLE_LABELS[styleSlug] ?? styleSlug.replace(/-/g, " ");
}

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort(compareSizeAttributeValues);
}

export function pdpPathForProduct(categorySlug: string, styleSlug: string, productSlug: string): string {
  if (storefrontFeatures.minimalPublicSite) {
    return PATH.PRODUCTS.PDP(productSlug);
  }
  return `/store/${categorySlug}/${styleSlug}/${productSlug}`;
}
