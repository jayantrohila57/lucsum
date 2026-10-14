export const STYLE_TAGS: Record<string, string> = {
  "style-branded-tape": "branded-tape",
  "style-contrast-panel": "contrast-panel",
  "style-celestial-graphic": "celestial-graphic",
  "style-shoulder-logo": "shoulder-logo",
  "style-raglan-baseball": "raglan-baseball",
};

export function shopifyId(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1] ?? gid;
}

export function paiseFromInr(price: string): number {
  return Math.round(Number.parseFloat(price) * 100);
}

export function styleFromTags(tags: string[]): string | null {
  for (const tag of tags) {
    if (STYLE_TAGS[tag]) return STYLE_TAGS[tag];
  }
  return null;
}

export type ShopifyProductImageSource = {
  media?: { nodes?: { image?: { url?: string } }[] };
};

export function productPrimaryImageUrl(product: ShopifyProductImageSource): string | null {
  const fromMedia = product.media?.nodes?.find((n) => n.image?.url)?.image?.url;
  return fromMedia ?? null;
}
