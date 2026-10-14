/**
 * Composes domain routers into `appRouter`. Procedure levels: `publicProcedure`, `protectedProcedure`,
 * `customerProcedure`, `staffProcedure`, `adminProcedure` (see `api.methods.ts`). Prefer `customerProcedure`
 * for checkout/cart-of-user flows; guests use cookie-bound cart procedures where documented.
 */
import { createCallerFactory, createTRPCRouter } from "@/core/api/api.methods";

import { addressRouter } from "@/module/address/address.api";
import { analyticsRouter } from "@/module/analytics/analytics.api";
import { attributeRouter } from "@/module/attribute/attribute.api";
import { cartRouter } from "@/module/cart/cart.api";
import { catalogRouter } from "@/module/catalog/catalog.api";
import { categoryRouter } from "@/module/category/category.api";
import { cookieConsentRouter } from "@/module/cookies/cookie-consent.api";
import { discountRouter } from "@/module/discount/discount.api";
import { inventoryRouter } from "@/module/inventory/inventory.api";
import { warehouseRouter } from "@/module/inventory/warehouse.api";
import { marketingContentRouter } from "@/module/marketing-content/marketing-content.api";
import { orderRouter } from "@/module/order/order.api";
import { paymentRouter } from "@/module/payment/payment.api";
import { productRouter } from "@/module/product/product.api";
import { productVariantRouter } from "@/module/product-variant/product-variant.api";
import { reviewRouter } from "@/module/review/review.api";
import { shipmentRouter } from "@/module/shipment/shipment.api";
import { shippingConfigRouter } from "@/module/shipping-config/shipping-config.api";
import { sitePageRouter } from "@/module/site-page/site-page.api";
import { subcategoryRouter } from "@/module/subcategory/subcategory.api";
import { wishlistRouter } from "@/module/wishlist/wishlist.api";

export const appRouter = createTRPCRouter({
  address: addressRouter,
  attribute: attributeRouter,
  cart: cartRouter,
  category: categoryRouter,
  catalog: catalogRouter,
  analytics: analyticsRouter,
  marketingContent: marketingContentRouter,
  subcategory: subcategoryRouter,
  product: productRouter,
  productVariant: productVariantRouter,
  review: reviewRouter,
  inventory: inventoryRouter,
  warehouse: warehouseRouter,
  order: orderRouter,
  payment: paymentRouter,
  wishlist: wishlistRouter,
  shipment: shipmentRouter,
  shippingConfig: shippingConfigRouter,
  discount: discountRouter,
  cookieConsent: cookieConsentRouter,
  sitePage: sitePageRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
