/**
 * Soft-deactivate demo/seed data so only LUCSUM Shopify catalogue remains visible.
 *
 * @see docs/SHOPIFY_IMPORT.md
 */
import "dotenv/config";
import { Pool } from "@neondatabase/serverless";
import { and, eq, ilike, inArray, isNull, notInArray, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../src/core/db/db.schema";
import {
  DEMO_CATEGORY_SLUG_PATTERNS,
  DEMO_PRODUCT_SLUG_PATTERNS,
  LUCSUM_CATALOG_CATEGORY_SLUGS,
} from "./purge-mock-data.lib";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

export async function runPurgeMockData(db: ReturnType<typeof drizzle>, options?: { dryRun?: boolean }) {
  const isDryRun = options?.dryRun ?? false;
  const now = new Date();

  const demoCategorySlugs = (
    await db
      .select({ slug: schema.category.slug })
      .from(schema.category)
      .where(
        and(
          isNull(schema.category.deletedAt),
          or(
            ...DEMO_CATEGORY_SLUG_PATTERNS.map((pattern) => ilike(schema.category.slug, pattern)),
            notInArray(schema.category.slug, [...LUCSUM_CATALOG_CATEGORY_SLUGS]),
          ),
        ),
      )
  ).map((c) => c.slug);

  const demoProductWhere = and(
    isNull(schema.product.deletedAt),
    or(
      notInArray(schema.product.categorySlug, [...LUCSUM_CATALOG_CATEGORY_SLUGS]),
      ...DEMO_PRODUCT_SLUG_PATTERNS.map((pattern) => ilike(schema.product.slug, pattern)),
      ilike(schema.product.title, "%Awesome Silk%"),
      demoCategorySlugs.length > 0 ? inArray(schema.product.categorySlug, demoCategorySlugs) : sql`false`,
    ),
  );

  const demoProducts = await db.select({ id: schema.product.id }).from(schema.product).where(demoProductWhere);
  const demoProductIds = demoProducts.map((p) => p.id);

  const counts = {
    products: demoProductIds.length,
    categories: demoCategorySlugs.length,
    marketing: 0,
    reviews: 0,
    discounts: 0,
    orders: 0,
    users: 0,
    subcategories: 0,
  };

  const seedMarketing = await db
    .select({ id: schema.marketingContent.id })
    .from(schema.marketingContent)
    .where(
      or(ilike(schema.marketingContent.id, "seed-marketing%"), ilike(schema.marketingContent.image, "%picsum.photos%")),
    );
  counts.marketing = seedMarketing.length;

  const seedReviews = await db
    .select({ id: schema.review.id })
    .from(schema.review)
    .where(
      or(
        ilike(schema.review.id, "seed-%"),
        demoProductIds.length > 0 ? inArray(schema.review.productId, demoProductIds) : sql`false`,
      ),
    );
  counts.reviews = seedReviews.length;

  const seedDiscounts = await db
    .select({ id: schema.discount.id })
    .from(schema.discount)
    .where(ilike(schema.discount.id, "seed-discount%"));
  counts.discounts = seedDiscounts.length;

  const seedOrders = await db
    .select({ id: schema.order.id })
    .from(schema.order)
    .where(ilike(schema.order.id, "seed-order%"));
  counts.orders = seedOrders.length;

  const seedUsers = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(ilike(schema.user.id, "seed-user%"));
  counts.users = seedUsers.length;

  const demoSubcategories = await db
    .select({ id: schema.subcategory.id })
    .from(schema.subcategory)
    .where(
      and(
        isNull(schema.subcategory.deletedAt),
        notInArray(schema.subcategory.categorySlug, [...LUCSUM_CATALOG_CATEGORY_SLUGS]),
      ),
    );
  counts.subcategories = demoSubcategories.length;

  console.log("[purge-mock] Planned changes:", counts);

  if (isDryRun) {
    return counts;
  }

  if (demoProductIds.length) {
    await db
      .update(schema.product)
      .set({ deletedAt: now, isActive: false, status: "archive", updatedAt: now })
      .where(inArray(schema.product.id, demoProductIds));
  }

  if (demoCategorySlugs.length) {
    await db
      .update(schema.category)
      .set({ deletedAt: now, isFeatured: false, updatedAt: now })
      .where(inArray(schema.category.slug, demoCategorySlugs));
  }

  if (counts.subcategories) {
    await db
      .update(schema.subcategory)
      .set({ deletedAt: now, isFeatured: false, updatedAt: now })
      .where(notInArray(schema.subcategory.categorySlug, [...LUCSUM_CATALOG_CATEGORY_SLUGS]));
  }

  if (counts.marketing) {
    await db
      .update(schema.marketingContent)
      .set({ isActive: false, updatedAt: now })
      .where(
        or(
          ilike(schema.marketingContent.id, "seed-marketing%"),
          ilike(schema.marketingContent.image, "%picsum.photos%"),
        ),
      );
  }

  if (counts.reviews) {
    await db
      .update(schema.review)
      .set({ isApproved: false, updatedAt: now })
      .where(
        or(
          ilike(schema.review.id, "seed-%"),
          demoProductIds.length > 0 ? inArray(schema.review.productId, demoProductIds) : sql`false`,
        ),
      );
  }

  if (counts.discounts) {
    await db
      .update(schema.discount)
      .set({ isActive: false, updatedAt: now })
      .where(ilike(schema.discount.id, "seed-discount%"));
  }

  if (counts.orders) {
    await db
      .update(schema.order)
      .set({ status: "cancelled", updatedAt: now })
      .where(ilike(schema.order.id, "seed-order%"));
  }

  if (counts.users) {
    await db
      .update(schema.user)
      .set({
        banned: true,
        banReason: "Deactivated seed demo account",
        updatedAt: now,
      })
      .where(ilike(schema.user.id, "seed-user%"));
  }

  await db
    .update(schema.category)
    .set({ isFeatured: true, updatedAt: now })
    .where(eq(schema.category.slug, "t-shirts"));

  console.log("[purge-mock] Done.");
  return counts;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({ client: pool, schema });
  await runPurgeMockData(db, { dryRun });
  await pool.end();
}

if (/purge-mock-data\.ts$/.test(process.argv[1] ?? "")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
