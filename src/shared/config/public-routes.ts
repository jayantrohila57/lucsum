import type { Route } from "next";
import { PATH } from "@/shared/config/routes";
import { storefrontFeatures } from "@/shared/config/storefront";

/** Customer-facing catalog + commerce URLs (minimal 3-page storefront). */
export const PUBLIC = {
  shop: (): Route => (storefrontFeatures.minimalPublicSite ? PATH.SHOP.ROOT : PATH.STORE.ROOT),
  product: (slug: string): Route =>
    storefrontFeatures.minimalPublicSite ? PATH.PRODUCTS.PDP(slug) : (`/store/t-shirts/${slug}` as Route),
  checkout: PATH.CHECKOUT.ROOT,
  checkoutPay: PATH.CHECKOUT.PAY,
  checkoutConfirmation: PATH.CHECKOUT.CONFIRMATION,
  order: (id: string): Route => PATH.ORDERS.DETAIL(id),
  help: PATH.HELP,
  cart: PATH.CART,
} as const;
