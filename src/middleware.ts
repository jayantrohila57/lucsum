import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { STOREFRONT_SIMPLIFIED } from "@/shared/config/storefront";
import { modernizeStorefrontDestination } from "@/shared/config/storefront-redirects";

function permanentRedirect(request: NextRequest, pathname: string, search = "") {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (search) {
    url.search = search.startsWith("?") ? search : `?${search}`;
  }
  return NextResponse.redirect(url, 301);
}

const EXACT_REDIRECTS: Record<string, string> = {
  "/store": "/shop",
  "/store/categories": "/shop",
  "/marketing/about": "/help#about",
  "/marketing/newsletter": "/help#contact",
  "/support": "/help",
  "/support/contact": "/help#contact",
  "/support/faq": "/help#faq",
  "/support/help-center": "/help#faq",
  "/support/shipping": "/legal/shipping-policy",
  "/support/returns": "/legal/return-policy",
  "/support/size-guide": "/help#faq",
  "/account/wishlist": "/shop",
  "/blog": "/",
  "/legal/refund-policy": "/legal/return-policy",
  "/legal/cookies-policy": "/legal/privacy-policy",
  "/legal/user-agreement": "/legal/terms-of-service",
  "/legal/data-protection": "/legal/privacy-policy",
  "/legal/licenses": "/legal",
  "/account/setting": "/account",
  "/account/setting/privacy": "/account",
  "/account/cart": "/cart",
  "/account/payment": "/account",
  "/account/shipment": "/account/order",
  "/account/review": "/account",
  "/sentry-example-page": "/",
  "/rss.xml": "/",
};

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/checkout/pay" || pathname === "/store/checkout/pay") {
    const orderId = request.nextUrl.searchParams.get("orderId");
    if (!orderId?.trim()) {
      const target = pathname.startsWith("/store/") ? "/checkout" : "/checkout";
      return permanentRedirect(request, target, search);
    }
  }

  if (!STOREFRONT_SIMPLIFIED) {
    if (EXACT_REDIRECTS[pathname]) {
      const dest = EXACT_REDIRECTS[pathname];
      const [path, hash] = dest.split("#");
      const url = request.nextUrl.clone();
      url.pathname = path;
      url.hash = hash ? `#${hash}` : "";
      return NextResponse.redirect(url, 301);
    }
    return NextResponse.next();
  }

  if (EXACT_REDIRECTS[pathname]) {
    const dest = EXACT_REDIRECTS[pathname];
    const [path, hash] = dest.split("#");
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.hash = hash ? `#${hash}` : "";
    return NextResponse.redirect(url, 301);
  }

  const invoiceMatch = pathname.match(/^\/account\/order\/([^/]+)\/invoice$/);
  if (invoiceMatch?.[1]) {
    return permanentRedirect(request, `/account/order/${invoiceMatch[1]}`, search);
  }

  const shipmentMatch = pathname.match(/^\/account\/shipment\/([^/]+)$/);
  if (shipmentMatch?.[1]) {
    return permanentRedirect(request, `/account/order/${shipmentMatch[1]}`, search);
  }

  if (pathname === "/store/checkout" || pathname.startsWith("/store/checkout/")) {
    return permanentRedirect(request, pathname.replace("/store/checkout", "/checkout"), search);
  }

  if (pathname.startsWith("/store/order/")) {
    const id = pathname.replace("/store/order/", "").split("/")[0];
    if (id) return permanentRedirect(request, `/orders/${id}`, search);
  }

  if (pathname.startsWith("/store/t-shirts/")) {
    const rest = pathname.slice("/store/t-shirts/".length);
    const segments = rest.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return permanentRedirect(request, `/products/${segments[1]}`, search);
    }
    if (segments.length === 1) {
      const params = new URLSearchParams(search);
      params.set("style", segments[0]);
      return permanentRedirect(request, "/shop", `?${params.toString()}`);
    }
  }

  if (pathname.startsWith("/store/collections/")) {
    return permanentRedirect(request, "/shop", search);
  }

  if (pathname.startsWith("/store/") && pathname !== "/store") {
    const modernized = modernizeStorefrontDestination(pathname);
    if (modernized !== pathname) {
      return permanentRedirect(request, modernized, search);
    }
    return permanentRedirect(request, "/shop", search);
  }

  if (pathname.startsWith("/blog/")) {
    return permanentRedirect(request, "/", search);
  }

  if (pathname.startsWith("/support/tickets")) {
    return permanentRedirect(request, "/help#contact", search);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/checkout/pay",
    "/store/checkout/pay",
    "/store/:path*",
    "/store",
    "/marketing/:path*",
    "/support/:path*",
    "/blog/:path*",
    "/blog",
    "/account/wishlist",
    "/account/order/:path*",
    "/account/setting/:path*",
    "/account/cart",
    "/account/payment",
    "/account/shipment/:path*",
    "/account/review",
    "/legal/:path*",
    "/sentry-example-page",
    "/rss.xml",
  ],
};
