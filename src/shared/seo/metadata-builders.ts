import type { Metadata } from "next";
import { brandIconPaths, brandPrimaryIconPath } from "./brand-icons";
import { getDefaultOgImageUrl, getMetadataBase, seoConfig } from "./seo.config";
import { absoluteUrl } from "./site-origin";

export type PageSeoInput = {
  title: string;
  description: string;
  /** Path starting with /, no query string */
  canonicalPath: string;
  /** When omitted, uses default OG image */
  ogImageUrls?: string[];
  ogType?: "website" | "article" | "product";
  robots?: Metadata["robots"];
  twitterCard?: "summary_large_image" | "summary";
};

const titleTemplate = `%s | ${seoConfig.siteName}`;

/** Avoid duplicated site name when CMS meta titles already include the brand. */
export function normalizePageTitle(title: string): string {
  const brand = seoConfig.siteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return title
    .replace(new RegExp(`\\s*\\|\\s*${brand}\\s*(\\|\\s*${brand}\\s*)*$`, "gi"), "")
    .replace(new RegExp(`^${brand}\\s*\\|\\s*`, "i"), "")
    .trim();
}

export function rootMetadataDefaults(): Metadata {
  const base = getMetadataBase();
  const defaultOg = getDefaultOgImageUrl();

  return {
    metadataBase: base,
    title: {
      default: seoConfig.siteName,
      template: titleTemplate,
    },
    description: seoConfig.description,
    applicationName: seoConfig.siteName,
    authors: [{ name: seoConfig.siteName, url: base.toString() }],
    creator: seoConfig.siteName,
    publisher: seoConfig.siteName,
    category: "shopping",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: seoConfig.locale,
      siteName: seoConfig.siteName,
      title: seoConfig.siteName,
      description: seoConfig.description,
      url: base,
      images: [
        {
          url: defaultOg,
          width: 1200,
          height: 630,
          alt: seoConfig.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoConfig.siteName,
      description: seoConfig.description,
      images: [defaultOg],
      ...(seoConfig.twitterSite ? { site: seoConfig.twitterSite, creator: seoConfig.twitterSite } : {}),
    },
    appleWebApp: {
      capable: true,
      title: seoConfig.shortName,
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: false,
    },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: brandPrimaryIconPath, type: "image/png" },
        ...brandIconPaths.map(({ src, sizes, type }) => ({ url: src, sizes, type })),
      ],
      apple: [
        { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: [{ url: brandPrimaryIconPath, type: "image/png" }],
      other: [
        {
          rel: "mask-icon",
          url: "/mask-icon.svg",
          color: seoConfig.themeColorDark,
        },
      ],
    },
    ...(seoConfig.googleSiteVerification
      ? {
          verification: {
            google: seoConfig.googleSiteVerification,
          },
        }
      : {}),
  };
}

/**
 * Strip common tracking params for canonical URLs when you later add `searchParams` to pages.
 */
export function canonicalPathFromPathname(pathname: string): string {
  return pathname.split("?")[0] || "/";
}

export function buildPageMetadata(input: PageSeoInput): Metadata {
  const canonical = absoluteUrl(canonicalPathFromPathname(input.canonicalPath));
  const images = (input.ogImageUrls?.length ? input.ogImageUrls : [getDefaultOgImageUrl()]).map((url) => ({
    url: url.startsWith("http") ? url : absoluteUrl(url),
  }));

  const ogType = input.ogType ?? "website";

  const title = normalizePageTitle(input.title);

  return {
    title,
    description: input.description,
    robots: input.robots,
    alternates: {
      canonical,
    },
    // Next.js Metadata types omit `product` for Open Graph; JSON-LD carries Product schema for rich results.
    openGraph: {
      type: ogType === "product" ? "website" : ogType,
      locale: seoConfig.locale,
      siteName: seoConfig.siteName,
      title,
      description: input.description,
      url: canonical,
      images,
    },
    twitter: {
      card: input.twitterCard ?? "summary_large_image",
      title,
      description: input.description,
      images: images.map((i) => i.url.toString()),
    },
  };
}

export { titleTemplate };
