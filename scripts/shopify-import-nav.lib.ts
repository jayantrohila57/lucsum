import { SHOPIFY_PAGE_ROUTE_BY_HANDLE } from "../src/shared/config/shopify-pages";
import { STYLE_TAGS } from "./shopify-import.lib";

const STYLE_HANDLES = new Set(Object.values(STYLE_TAGS));

export type ShopifyMenuItemExport = {
  title: string;
  type: string;
  url: string;
  items?: ShopifyMenuItemExport[];
};

export type ShopifyMenuExport = {
  handle: string;
  title: string;
  items: ShopifyMenuItemExport[];
};

export function mapShopifyMenuUrlToAppPath(url: string, productPathByHandle: Record<string, string>): string {
  if (!url || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) {
    return url;
  }
  const path = url.split("?")[0] ?? url;
  if (path.startsWith("/collections/")) {
    const handle = path.replace(/^\/collections\//, "");
    if (handle === "t-shirts") return "/store/t-shirts";
    if (STYLE_HANDLES.has(handle)) return `/store/t-shirts/${handle}`;
    return `/store/collections/${handle}`;
  }
  if (path.startsWith("/products/")) {
    const handle = path.replace(/^\/products\//, "");
    return productPathByHandle[handle] ?? path;
  }
  if (path.startsWith("/pages/")) {
    const handle = path.replace(/^\/pages\//, "");
    return SHOPIFY_PAGE_ROUTE_BY_HANDLE[handle] ?? path;
  }
  if (path.startsWith("/blogs/")) {
    const parts = path.replace(/^\/blogs\//, "").split("/");
    if (parts.length >= 2) return `/blog/${parts[1]}`;
  }
  if (path === "/collections") return "/store";
  return path;
}

export function mapMenuTree(
  items: ShopifyMenuItemExport[],
  productPathByHandle: Record<string, string>,
): ShopifyMenuItemExport[] {
  return items.map((item) => ({
    ...item,
    url: mapShopifyMenuUrlToAppPath(item.url, productPathByHandle),
    items: item.items?.length ? mapMenuTree(item.items, productPathByHandle) : [],
  }));
}
