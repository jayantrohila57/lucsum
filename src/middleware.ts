import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { STOREFRONT_SIMPLIFIED } from "@/shared/config/storefront";

const REDIRECTS: Record<string, string> = {
  "/store/categories": "/store",
  "/marketing/newsletter": "/support/contact",
};

const STYLE_PREFIX = "/store/t-shirts/";

export function middleware(request: NextRequest) {
  if (!STOREFRONT_SIMPLIFIED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(REDIRECTS[pathname], request.url));
  }

  if (pathname.startsWith(STYLE_PREFIX)) {
    const rest = pathname.slice(STYLE_PREFIX.length);
    const segments = rest.split("/").filter(Boolean);
    if (segments.length === 1) {
      const style = segments[0];
      const url = request.nextUrl.clone();
      url.pathname = "/store";
      url.searchParams.set("style", style);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/store/collections/")) {
    const collection = pathname.replace("/store/collections/", "").split("/")[0];
    if (collection) {
      const url = request.nextUrl.clone();
      url.pathname = "/store";
      url.searchParams.set("collection", collection);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/account/wishlist") {
    return NextResponse.redirect(new URL("/store", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/store/:path*", "/account/wishlist", "/marketing/newsletter"],
};
