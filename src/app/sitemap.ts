import type { MetadataRoute } from "next";
import { db } from "@/core/db/db";
import { getSiteOrigin } from "@/shared/seo/site-origin";

const LEGAL_SLUGS = [
  "terms-of-service",
  "privacy-policy",
  "shipping-policy",
  "refund-policy",
  "return-policy",
  "user-agreement",
  "data-protection",
  "cookies-policy",
] as const;

const STATIC_PATHS = [
  "/",
  "/store",
  "/store/categories",
  "/marketing/about",
  "/marketing/newsletter",
  "/support",
  "/support/contact",
  "/support/shipping",
  "/support/returns",
  "/support/faq",
  "/support/help-center",
  "/support/size-guide",
  "/legal",
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

  for (const p of STATIC_PATHS) {
    add(p);
  }
  for (const slug of LEGAL_SLUGS) {
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
}
