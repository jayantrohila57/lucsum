/** Map legacy storefront paths to minimal public URLs (301 targets). */
export function modernizeStorefrontDestination(destination: string): string {
  if (destination.startsWith("/products/")) {
    return destination;
  }

  const productPath = destination.match(/^\/store\/t-shirts\/[^/]+\/([^/?#]+)$/);
  if (productPath?.[1]) {
    return `/products/${productPath[1]}`;
  }

  if (destination === "/store" || destination.startsWith("/store?")) {
    return destination.replace("/store", "/shop");
  }

  const styleOnly = destination.match(/^\/store\/t-shirts\/([^/?#]+)$/);
  if (styleOnly?.[1]) {
    return `/shop?style=${styleOnly[1]}`;
  }

  if (destination.startsWith("/store/collections/")) {
    return "/shop";
  }

  if (destination.startsWith("/store/checkout")) {
    return destination.replace("/store/checkout", "/checkout");
  }

  if (destination.startsWith("/store/order/")) {
    return destination.replace("/store/order/", "/orders/");
  }

  if (destination === "/marketing/about" || destination.startsWith("/support/contact")) {
    return "/help#contact";
  }
  if (destination.startsWith("/support/faq") || destination.startsWith("/support/help-center")) {
    return "/help#faq";
  }
  if (destination === "/support" || destination.startsWith("/support/")) {
    return "/help";
  }

  return destination;
}
