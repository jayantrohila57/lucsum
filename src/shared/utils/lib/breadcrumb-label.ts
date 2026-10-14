import { slugToTitle } from "./url.utils";

/** Known catalogue segments (Shopify backup handles). */
const SLUG_LABEL_OVERRIDES: Record<string, string> = {
  "t-shirts": "T-Shirts",
  collections: "Collections",
  store: "Store",
  "branded-tape": "Branded Tape",
  "contrast-panel": "Contrast Panel",
  "celestial-graphic": "Celestial Graphic",
  "shoulder-logo": "Shoulder Logo",
  "raglan-baseball": "Raglan Baseball",
};

const SIZE_LABELS: Record<string, string> = {
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
  xxl: "XXL",
};

export function formatBreadcrumbLabel(segment: string | null | undefined): string {
  if (!segment) return "";
  const key = segment.toLowerCase();
  if (SLUG_LABEL_OVERRIDES[key]) return SLUG_LABEL_OVERRIDES[key];
  if (SIZE_LABELS[key]) return SIZE_LABELS[key];
  return slugToTitle(segment);
}

export const SIZE_ATTRIBUTE_ORDER = ["S", "M", "L", "XL", "XXL"] as const;

export function compareSizeAttributeValues(a: string, b: string): number {
  const ai = SIZE_ATTRIBUTE_ORDER.indexOf(a as (typeof SIZE_ATTRIBUTE_ORDER)[number]);
  const bi = SIZE_ATTRIBUTE_ORDER.indexOf(b as (typeof SIZE_ATTRIBUTE_ORDER)[number]);
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  return a.localeCompare(b);
}
