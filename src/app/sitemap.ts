import type { MetadataRoute } from "next";
import { db } from "@/core/db/db";
import { STOREFRONT_SIMPLIFIED } from "@/shared/config/storefront";
import { getSiteOrigin } from "@/shared/seo/site-origin";

const LEGAL_SLUGS_MINIMAL = ["terms-of-service", "privacy-policy", "shipping-policy", "return-policy"] as const;

const LEGAL_SLUGS_FULL = [
  "terms-of-service",
  "privacy-policy",
  "shipping-policy",
  "refund-policy",
  "return-policy",
  "user-agreement",
  "data-protection",
  "cookies-policy",
] as const;

const STATIC_PATHS_MINIMAL = ["/", "/shop", "/help", "/cart", "/checkout", "/checkout/confirmation", "/legal"] as const;

const STATIC_PATHS_FULL = [
  "/",
  "/store",
  "/cart",
  "/marketing/about",
  "/support",
  "/support/contact",
  "/support/shipping",
  "/support/returns",
  "/support/faq",
  "/support/help-center",
  "/support/size-guide",
  "/legal",
  "/store/checkout",
  "/store/categories",
  "/marketing/newsletter",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteOrigin();
  const fallback = new Date();
  const byUrl = new Map<string, Date>();

  const add = (path: string, lastModified?: Date | null) => {
    const url = path === "/" || path === "" ? `${base}/` : `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const d = lastModified && !Number.isNaN(lastModified.getTime()) ? lastModified : fallback;
    const prev = byUrl.get(url);
    if (!prev || d > prev) byUrl.set(url, d);
  };

  const staticPaths = STOREFRONT_SIMPLIFIED ? STATIC_PATHS_MINIMAL : STATIC_PATHS_FULL;
  const legalSlugs = STOREFRONT_SIMPLIFIED ? LEGAL_SLUGS_MINIMAL : LEGAL_SLUGS_FULL;

  for (const p of staticPaths) {
    add(p);
  }
  for (const slug of legalSlugs) {
    add(`/legal/${slug}`);
  }

  try {
    await appendCatalogUrls(add);
  } catch {
    // Build/CI may run without a reachable database; static URLs above are enough.
  }

  return [...byUrl.entries()].map(([url, lastModified]) => ({ url, lastModified }));
}

async function appendCatalogUrls(add: (path: string, lastModified?: Date | null) => void) {
  if (STOREFRONT_SIMPLIFIED) {
    const products = await db.query.product.findMany({
      where: (p, { and, eq, isNull: isNullFn }) =>
        and(isNullFn(p.deletedAt), eq(p.isActive, true), eq(p.status, "live"), eq(p.categorySlug, "t-shirts")),
      columns: { slug: true, updatedAt: true },
    });

    for (const p of products) {
      add(`/products/${p.slug}`, p.updatedAt);
    }
    return;
  }

  const publicCategories = await db.query.category.findMany({
    where: (c, { and, eq, isNull: isNullFn }) => and(isNullFn(c.deletedAt), eq(c.visibility, "public")),
    columns: { slug: true, updatedAt: true },
  });

  const categorySlugs = new Set(publicCategories.map((c) => c.slug));
  for (const c of publicCategories) {
    add(`/store/${c.slug}`, c.updatedAt);
  }

  const publicSubs = await db.query.subcategory.findMany({
    where: (s, { and, eq, isNull: isNullFn }) => and(isNullFn(s.deletedAt), eq(s.visibility, "public")),
    columns: { slug: true, categorySlug: true, updatedAt: true },
  });

  const publicSubKeys = new Set(
    publicSubs.filter((s) => categorySlugs.has(s.categorySlug)).map((s) => `${s.categorySlug}/${s.slug}`),
  );

  for (const s of publicSubs) {
    if (!categorySlugs.has(s.categorySlug)) continue;
    add(`/store/${s.categorySlug}/${s.slug}`, s.updatedAt);
  }

  const products = await db.query.product.findMany({
    where: (p, { and, eq, isNull: isNullFn }) => and(isNullFn(p.deletedAt), eq(p.isActive, true), eq(p.status, "live")),
    columns: {
      categorySlug: true,
      subcategorySlug: true,
      slug: true,
      updatedAt: true,
    },
    with: {
      variants: {
        where: (pv, { isNull: isNullFn }) => isNullFn(pv.deletedAt),
        columns: { slug: true, updatedAt: true },
      },
    },
  });

  for (const p of products) {
    if (!publicSubKeys.has(`${p.categorySlug}/${p.subcategorySlug}`)) continue;

    if (p.variants.length === 0) {
      add(`/store/${p.categorySlug}/${p.subcategorySlug}/${p.slug}`, p.updatedAt);
    } else {
      for (const v of p.variants) {
        add(`/store/${p.categorySlug}/${p.subcategorySlug}/${v.slug}`, v.updatedAt ?? p.updatedAt);
      }
    }
  }

  const articles = await db.query.sitePage.findMany({
    where: (sp, { eq }) => eq(sp.kind, "article"),
    columns: { slug: true, updatedAt: true },
  });
  for (const article of articles) {
    add(`/blog/${article.slug}`, article.updatedAt);
  }
}
