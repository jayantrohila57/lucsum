/**
 * Idempotent Shopify catalogue import for LUCSUM.
 *
 * @see docs/SHOPIFY_IMPORT.md
 */
import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { and, eq, ilike, inArray, isNull, notExists, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { v4 as uuidv4 } from "uuid";
import * as schema from "../src/core/db/db.schema";
import { paiseFromInr, productPrimaryImageUrl, STYLE_TAGS, shopifyId, styleFromTags } from "./shopify-import.lib";

const STYLE_SUBCATEGORY_TITLES: Record<string, string> = {
  "branded-tape": "Branded Tape",
  "contrast-panel": "Contrast Panel",
  "celestial-graphic": "Celestial Graphic",
  "shoulder-logo": "Shoulder Logo",
  "raglan-baseball": "Raglan Baseball",
};

const PAGE_ROUTE_MAP: Record<string, string> = {
  about: "/marketing/about",
  contact: "/support/contact",
  shipping: "/support/shipping",
  faq: "/support/faq",
  "returns-refunds": "/support/returns",
  "size-fit": "/support/size-guide",
  "track-order": "/account/order",
  "care-guide": "/support/help-center",
  "why-lucsum": "/marketing/about",
};

const POLICY_SLUG_MAP: Record<string, string> = {
  "privacy-policy": "/legal/privacy-policy",
  "terms-of-service": "/legal/terms-of-service",
  "refund-policy": "/legal/refund-policy",
  "shipping-policy": "/legal/shipping-policy",
  "contact-information": "/support/contact",
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const cleanupOnly = args.has("--cleanup-demo");
const skipImages = args.has("--skip-images") || !process.env.BLOB_READ_WRITE_TOKEN;

const exportDir = process.env.SHOPIFY_EXPORT_DIR ?? path.join(process.cwd(), "data/shopify-export");

function loadJson<T>(file: string): T {
  const p = path.join(exportDir, file);
  if (!existsSync(p)) throw new Error(`Missing export file: ${p}`);
  return JSON.parse(readFileSync(p, "utf8")) as T;
}

async function uploadImage(url: string, pathname: string): Promise<string> {
  if (skipImages) return url;
  const res = await fetch(url);
  if (!res.ok) return url;
  const blob = await res.blob();
  const uploaded = await put(pathname, blob, { access: "public", addRandomSuffix: false });
  return uploaded.url;
}

async function cleanupDemo(db: ReturnType<typeof drizzle>) {
  const demoCategorySlugs = (
    await db
      .select({ slug: schema.category.slug })
      .from(schema.category)
      .where(or(ilike(schema.category.slug, "seed-category%"), ilike(schema.category.slug, "demo-%")))
  ).map((c) => c.slug);

  const demoProducts = await db
    .select({ id: schema.product.id })
    .from(schema.product)
    .where(
      and(
        or(
          ilike(schema.product.slug, "seed-product-%"),
          ilike(schema.product.slug, "seed-%"),
          ilike(schema.product.title, "%Awesome Silk%"),
          demoCategorySlugs.length > 0 ? inArray(schema.product.categorySlug, demoCategorySlugs) : sql`false`,
        ),
        notExists(
          db
            .select({ one: sql`1` })
            .from(schema.orderItem)
            .innerJoin(schema.productVariant, eq(schema.productVariant.id, schema.orderItem.variantId))
            .where(eq(schema.productVariant.productId, schema.product.id)),
        ),
      ),
    );

  if (dryRun) {
    console.log(
      `[dry-run] Would remove ${demoProducts.length} demo products and ${demoCategorySlugs.length} demo categories`,
    );
    return;
  }

  if (demoProducts.length) {
    const demoIds = demoProducts.map((p) => p.id);
    const demoVariants = await db
      .select({ id: schema.productVariant.id })
      .from(schema.productVariant)
      .where(inArray(schema.productVariant.productId, demoIds));
    const variantIds = demoVariants.map((v) => v.id);
    if (variantIds.length) {
      await db.delete(schema.inventoryItem).where(inArray(schema.inventoryItem.variantId, variantIds));
      await db.delete(schema.productVariant).where(inArray(schema.productVariant.id, variantIds));
    }
    await db.delete(schema.productCollection).where(inArray(schema.productCollection.productId, demoIds));
    await db.delete(schema.product).where(inArray(schema.product.id, demoIds));
  }
  if (demoCategorySlugs.length) {
    await db.delete(schema.subcategory).where(
      and(
        inArray(schema.subcategory.categorySlug, demoCategorySlugs),
        notExists(
          db
            .select({ one: sql`1` })
            .from(schema.product)
            .where(and(eq(schema.product.subcategorySlug, schema.subcategory.slug), isNull(schema.product.deletedAt))),
        ),
      ),
    );
    await db.delete(schema.category).where(
      and(
        inArray(schema.category.slug, demoCategorySlugs),
        notExists(
          db
            .select({ one: sql`1` })
            .from(schema.product)
            .where(and(eq(schema.product.categorySlug, schema.category.slug), isNull(schema.product.deletedAt))),
        ),
      ),
    );
  }
  console.log(`Removed ${demoProducts.length} demo products and ${demoCategorySlugs.length} demo categories`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({ client: pool, schema });

  if (cleanupOnly) {
    await cleanupDemo(db);
    await pool.end();
    return;
  }

  const productsFile = loadJson<{ data: { products: { nodes: ShopifyProduct[] } } }>("products.json");
  const variantsFile = loadJson<{ data: { productVariants: { nodes: ShopifyVariant[] } } }>("variants.json");
  const collectionsFile = loadJson<{ data: { collections: { nodes: ShopifyCollection[] } } }>("collections.json");
  const misc = loadJson<{ data: ShopifyMisc }>("content-misc.json");

  const activeProducts = productsFile.data.products.nodes.filter((p) => p.status === "ACTIVE");
  console.log(`Importing ${activeProducts.length} active products (skipping DRAFT legacy listings)`);

  const variantsByProduct = new Map<string, ShopifyVariant[]>();
  for (const v of variantsFile.data.productVariants.nodes) {
    const pid = shopifyId(v.product.id);
    const list = variantsByProduct.get(pid) ?? [];
    list.push(v);
    variantsByProduct.set(pid, list);
  }

  const pathMap: Record<string, string> = {};
  const redirects: { source: string; destination: string; permanent: boolean }[] = [];

  const categorySlug = "t-shirts";
  const collectionsCategorySlug = "collections";

  if (!dryRun) {
    await cleanupDemo(db);
  }

  if (!dryRun) {
    await db
      .insert(schema.category)
      .values({
        id: uuidv4(),
        slug: categorySlug,
        title: "T-Shirts",
        description: "LUCSUM oversized cotton tees.",
        visibility: "public",
        displayOrder: 0,
        isFeatured: true,
      })
      .onConflictDoNothing({ target: schema.category.slug });

    await db
      .insert(schema.category)
      .values({
        id: uuidv4(),
        slug: collectionsCategorySlug,
        title: "Collections",
        description: "Shop by style, colour, and edit.",
        visibility: "public",
        displayOrder: 1,
        isFeatured: false,
      })
      .onConflictDoNothing({ target: schema.category.slug });

    await db
      .insert(schema.warehouse)
      .values({
        id: "wh-lucsum-primary",
        code: "LUCSUM-SNP",
        name: "LUCSUM Saharanpur",
        country: "IN",
        state: "Uttar Pradesh",
        city: "Saharanpur",
        addressLine1: "2653 Radha Vihar",
        postalCode: "247001",
        isActive: true,
      })
      .onConflictDoNothing({ target: schema.warehouse.code });
  }

  for (const styleSlug of Object.values(STYLE_TAGS)) {
    if (!dryRun) {
      await db
        .insert(schema.subcategory)
        .values({
          id: uuidv4(),
          categorySlug,
          slug: styleSlug,
          title: STYLE_SUBCATEGORY_TITLES[styleSlug] ?? styleSlug,
          visibility: "public",
          displayOrder: 0,
        })
        .onConflictDoNothing({ target: schema.subcategory.slug });
    }
  }

  for (const col of collectionsFile.data.collections.nodes) {
    const isStyle = Object.values(STYLE_TAGS).includes(col.handle);
    const catSlug = isStyle ? categorySlug : collectionsCategorySlug;

    redirects.push({
      source: `/collections/${col.handle}`,
      destination: isStyle ? `/store/${categorySlug}/${col.handle}` : `/store/${collectionsCategorySlug}/${col.handle}`,
      permanent: true,
    });

    if (!dryRun) {
      await db
        .insert(schema.catalogCollection)
        .values({
          slug: col.handle,
          title: col.title,
          description: col.descriptionHtml?.replace(/<[^>]+>/g, " ").trim() ?? null,
          metaTitle: col.seo?.title ?? null,
          metaDescription: col.seo?.description ?? null,
          image: col.image?.url ?? null,
        })
        .onConflictDoUpdate({
          target: schema.catalogCollection.slug,
          set: {
            title: col.title,
            description: col.descriptionHtml?.replace(/<[^>]+>/g, " ").trim() ?? null,
            metaTitle: col.seo?.title ?? null,
            metaDescription: col.seo?.description ?? null,
            image: col.image?.url ?? null,
            updatedAt: new Date(),
          },
        });

      if (!isStyle) {
        await db
          .insert(schema.subcategory)
          .values({
            id: uuidv4(),
            categorySlug: catSlug,
            slug: col.handle,
            title: col.title,
            description: col.descriptionHtml?.replace(/<[^>]+>/g, " ").trim() ?? null,
            metaTitle: col.seo?.title ?? null,
            metaDescription: col.seo?.description ?? null,
            image: col.image?.url ?? null,
            collectionSlug: col.handle,
            visibility: "public",
            displayOrder: 0,
          })
          .onConflictDoUpdate({
            target: schema.subcategory.slug,
            set: {
              title: col.title,
              description: col.descriptionHtml?.replace(/<[^>]+>/g, " ").trim() ?? null,
              collectionSlug: col.handle,
              updatedAt: new Date(),
            },
          });
      }
    }
  }

  for (const product of activeProducts) {
    const pid = shopifyId(product.id);
    const style = styleFromTags(product.tags);
    if (!style) {
      console.warn(`Skipping product without style tag: ${product.handle}`);
      continue;
    }

    const productId = `shopify-product-${pid}`;
    const variantRows = variantsByProduct.get(pid) ?? [];
    const basePrice = paiseFromInr(variantRows[0]?.price ?? "999");

    let baseImage = productPrimaryImageUrl(product);
    if (baseImage && !dryRun && !skipImages) {
      baseImage = await uploadImage(baseImage, `products/${product.handle}/featured.png`);
    }

    const storePath = `/store/${categorySlug}/${style}/${product.handle}`;
    pathMap[product.handle] = storePath;
    redirects.push({ source: `/products/${product.handle}`, destination: storePath, permanent: true });

    if (!dryRun) {
      await db
        .insert(schema.product)
        .values({
          id: productId,
          title: product.title,
          description: product.descriptionHtml,
          metaTitle: product.seo?.title ?? null,
          metaDescription: product.seo?.description ?? null,
          slug: product.handle,
          categorySlug,
          subcategorySlug: style,
          basePrice,
          baseCurrency: "INR",
          baseImage,
          isActive: true,
          status: "live",
          tracksInventory: true,
        })
        .onConflictDoUpdate({
          target: schema.product.slug,
          set: {
            title: product.title,
            description: product.descriptionHtml,
            metaTitle: product.seo?.title ?? null,
            metaDescription: product.seo?.description ?? null,
            categorySlug,
            subcategorySlug: style,
            basePrice,
            baseImage,
            isActive: true,
            status: "live",
            updatedAt: new Date(),
          },
        });

      for (const cn of product.collections?.nodes ?? []) {
        await db
          .insert(schema.productCollection)
          .values({
            id: `pc-${pid}-${cn.handle}`,
            productId,
            collectionSlug: cn.handle,
          })
          .onConflictDoNothing();
      }
    }

    for (const variant of variantRows) {
      const vid = shopifyId(variant.id);
      const variantId = `shopify-variant-${vid}`;
      const size = variant.selectedOptions.find((o) => o.name === "Size")?.value ?? variant.title;
      const variantSlug = `${product.handle}-${size.toLowerCase()}`;

      let mediaUrl = variant.image?.url ?? baseImage;
      if (mediaUrl && !dryRun && !skipImages && variant.image?.url) {
        mediaUrl = await uploadImage(mediaUrl, `products/${product.handle}/${variantSlug}.png`);
      }

      const qty =
        variant.inventoryItem?.inventoryLevels?.nodes?.[0]?.quantities?.find((q) => q.name === "available")?.quantity ??
        0;

      if (!dryRun) {
        await db
          .insert(schema.productVariant)
          .values({
            id: variantId,
            slug: variantSlug,
            productId,
            title: size,
            priceModifierType: "flat_decrease",
            priceModifierValue: "0",
            attributes: [{ title: "Size", type: "size", value: size }],
            media: mediaUrl ? [{ url: mediaUrl }] : null,
          })
          .onConflictDoUpdate({
            target: schema.productVariant.slug,
            set: {
              title: size,
              media: mediaUrl ? [{ url: mediaUrl }] : null,
              updatedAt: new Date(),
            },
          });

        await db
          .insert(schema.inventoryItem)
          .values({
            id: `inv-${vid}`,
            variantId,
            warehouseId: "wh-lucsum-primary",
            sku: variant.sku,
            quantity: qty,
            reserved: 0,
          })
          .onConflictDoUpdate({
            target: schema.inventoryItem.id,
            set: {
              sku: variant.sku,
              quantity: qty,
              updatedAt: new Date(),
            },
          });
      }
    }
  }

  for (const page of misc.data.pages?.nodes ?? []) {
    if (!page.isPublished) continue;
    const mapped = PAGE_ROUTE_MAP[page.handle];
    redirects.push({
      source: `/pages/${page.handle}`,
      destination: mapped ?? `/pages/${page.handle}`,
      permanent: true,
    });

    if (!dryRun) {
      await db
        .insert(schema.sitePage)
        .values({
          id: `page-${page.handle}`,
          slug: page.handle,
          kind: "page",
          title: page.title,
          bodyHtml: page.body,
          metaTitle: page.metafields?.nodes?.find((m) => m.key === "title_tag")?.value ?? null,
          metaDescription: page.metafields?.nodes?.find((m) => m.key === "description_tag")?.value ?? null,
          publishedAt: page.publishedAt ? new Date(page.publishedAt) : null,
        })
        .onConflictDoUpdate({
          target: schema.sitePage.slug,
          set: {
            title: page.title,
            bodyHtml: page.body,
            metaTitle: page.metafields?.nodes?.find((m) => m.key === "title_tag")?.value ?? null,
            metaDescription: page.metafields?.nodes?.find((m) => m.key === "description_tag")?.value ?? null,
            updatedAt: new Date(),
          },
        });
    }
  }

  for (const policy of misc.data.shop?.shopPolicies ?? []) {
    const slug = policy.type?.toLowerCase().replace(/_/g, "-") ?? "policy";
    const mapped = POLICY_SLUG_MAP[slug] ?? `/legal/${slug}`;
    redirects.push({ source: `/policies/${slug}`, destination: mapped, permanent: true });

    if (!dryRun && policy.body) {
      await db
        .insert(schema.sitePage)
        .values({
          id: `policy-${slug}`,
          slug: `policy-${slug}`,
          kind: "policy",
          title: policy.title,
          bodyHtml: policy.body,
          publishedAt: new Date(),
        })
        .onConflictDoNothing();
    }
  }

  const blogHandle = misc.data.blogs?.nodes?.[0]?.handle ?? "journal";
  for (const article of misc.data.articles?.nodes ?? []) {
    redirects.push({
      source: `/blogs/${blogHandle}/${article.handle}`,
      destination: `/blog/${article.handle}`,
      permanent: true,
    });
    if (!dryRun) {
      await db
        .insert(schema.sitePage)
        .values({
          id: `article-${article.handle}`,
          slug: article.handle,
          kind: "article",
          title: article.title,
          bodyHtml: article.body ?? article.summary ?? "",
          metaTitle: article.seo?.title ?? null,
          metaDescription: article.seo?.description ?? null,
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
        })
        .onConflictDoUpdate({
          target: schema.sitePage.slug,
          set: {
            title: article.title,
            bodyHtml: article.body ?? article.summary ?? "",
            updatedAt: new Date(),
          },
        });
    }
  }

  for (const r of misc.data.urlRedirects?.nodes ?? []) {
    let destination = r.target;
    if (destination.startsWith("/products/")) {
      const handle = destination.replace(/^\/products\//, "").split("?")[0]!;
      destination = pathMap[handle] ?? destination;
    }
    redirects.push({ source: r.path, destination, permanent: true });
  }

  const outDir = path.join(process.cwd(), "data");
  writeFileSync(path.join(outDir, "catalog-paths.json"), JSON.stringify(pathMap, null, 2));
  writeFileSync(path.join(outDir, "shopify-redirects.json"), JSON.stringify(redirects, null, 2));

  console.log(
    `Import ${dryRun ? "(dry-run) " : ""}finished: ${activeProducts.length} products, ${redirects.length} redirects written to data/`,
  );

  await pool.end();
}

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  status: string;
  tags: string[];
  descriptionHtml: string;
  seo?: { title?: string; description?: string };
  media?: { nodes?: { image?: { url?: string } }[] };
  collections?: { nodes?: { handle: string }[] };
};

type ShopifyVariant = {
  id: string;
  product: { id: string };
  title: string;
  sku: string;
  price: string;
  selectedOptions: { name: string; value: string }[];
  image?: { url?: string };
  inventoryItem?: {
    inventoryLevels?: {
      nodes?: { quantities?: { name: string; quantity: number }[] }[];
    };
  };
};

type ShopifyCollection = {
  handle: string;
  title: string;
  descriptionHtml?: string;
  seo?: { title?: string; description?: string };
  image?: { url?: string };
};

type ShopifyMisc = {
  pages?: {
    nodes: {
      handle: string;
      title: string;
      body: string;
      isPublished: boolean;
      publishedAt?: string;
      metafields?: { nodes: { key: string; value: string }[] };
    }[];
  };
  articles?: {
    nodes: {
      handle: string;
      title: string;
      body?: string;
      summary?: string;
      publishedAt?: string;
      seo?: { title?: string; description?: string };
    }[];
  };
  blogs?: { nodes: { handle: string }[] };
  urlRedirects?: { nodes: { path: string; target: string }[] };
  shop?: { shopPolicies?: { title: string; body?: string; type?: string }[] };
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
