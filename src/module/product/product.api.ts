import { and, eq, ilike, inArray, isNull, not, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createTRPCRouter, publicProcedure, staffProcedure } from "@/core/api/api.methods";
import { db } from "@/core/db/db";
import {
  category,
  inventoryItem,
  product,
  productCollection,
  productVariant,
  review,
  subcategory,
} from "@/core/db/db.schema";
import { MESSAGE, STATUS } from "@/shared/config/api.config";
import { API_RESPONSE } from "@/shared/config/api.utils";
import { buildPagination, buildPaginationMeta } from "@/shared/schema";
import { debugError } from "@/shared/utils/lib/logger.utils";
import { productContract } from "./product.schema";
import { colorLabelFromProductSlug, pdpPathForProduct, sortSizes, styleTitle } from "./shop-catalog.lib";

/**
 * Validate that category and subcategory exist and belong together.
 * Returns null if valid, error message string if invalid.
 */
async function validateCategorySubcategory(categorySlug: string, subcategorySlug: string): Promise<string | null> {
  // Check category exists
  const [cat] = await db
    .select({ slug: category.slug })
    .from(category)
    .where(and(eq(category.slug, categorySlug), isNull(category.deletedAt)))
    .limit(1);

  if (!cat) {
    return "Selected category does not exist";
  }

  // Check subcategory exists and belongs to the category
  const [sub] = await db
    .select({ slug: subcategory.slug, parentSlug: subcategory.categorySlug })
    .from(subcategory)
    .where(
      and(
        eq(subcategory.slug, subcategorySlug),
        eq(subcategory.categorySlug, categorySlug),
        isNull(subcategory.deletedAt),
      ),
    )
    .limit(1);

  if (!sub) {
    return "Selected subcategory does not exist or does not belong to the selected category";
  }

  return null;
}

async function loadPdpSeoForVariant(productId: string, variantId: string) {
  const [aggRow] = await db
    .select({
      avg: sql<number>`coalesce(avg(${review.rating}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(review)
    .where(and(eq(review.productId, productId), eq(review.isApproved, true)));

  const reviewCount = Number(aggRow?.count ?? 0);
  const reviewAggregate =
    reviewCount > 0
      ? {
          ratingValue: Math.round(Number(aggRow?.avg ?? 0) * 10) / 10,
          reviewCount,
        }
      : null;

  const reviewRows = await db.query.review.findMany({
    where: (r, { eq, and }) => and(eq(r.productId, productId), eq(r.isApproved, true)),
    orderBy: (r, { desc: d }) => [d(r.createdAt)],
    limit: 5,
    columns: {
      rating: true,
      title: true,
      comment: true,
      createdAt: true,
    },
  });

  const reviewsForSchema =
    reviewRows.length > 0
      ? reviewRows.map((r) => {
          const parts = [r.title?.trim(), r.comment?.trim()].filter(Boolean);
          const reviewBody = (parts.join(" — ").trim() || "Review").slice(0, 5000);
          return {
            ratingValue: r.rating,
            reviewBody,
            datePublished: r.createdAt.toISOString().slice(0, 10),
          };
        })
      : undefined;

  const invRows = await db
    .select({
      sku: inventoryItem.sku,
      barcode: inventoryItem.barcode,
      qty: sql<number>`greatest(0, ${inventoryItem.quantity} - ${inventoryItem.reserved})`,
    })
    .from(inventoryItem)
    .where(and(eq(inventoryItem.variantId, variantId), isNull(inventoryItem.deletedAt)));

  let availableQuantity = 0;
  for (const row of invRows) {
    availableQuantity += Number(row.qty);
  }
  const variantInventory =
    invRows.length > 0
      ? {
          sku: invRows[0]?.sku ?? null,
          availableQuantity,
          barcode: invRows[0]?.barcode ?? null,
        }
      : null;

  return { reviewAggregate, reviewsForSchema, variantInventory };
}

export const productRouter = createTRPCRouter({
  get: staffProcedure
    .input(productContract.get.input)
    .output(productContract.get.output)
    .query(async ({ input }) => {
      try {
        const { id, slug } = input.params;

        if (!id && !slug) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.PRODUCT.GET.FAILED, null);
        }

        let row: typeof product.$inferSelect | undefined;

        if (id) {
          const output = await db
            .select()
            .from(product)
            .where(and(eq(product.id, id), isNull(product.deletedAt)))
            .limit(1);
          row = output?.[0];
        } else if (slug) {
          const output = await db
            .select()
            .from(product)
            .where(and(eq(product.slug, slug), isNull(product.deletedAt)))
            .limit(1);
          row = output?.[0];
        }

        return API_RESPONSE(
          row ? STATUS.SUCCESS : STATUS.FAILED,
          row ? MESSAGE.PRODUCT.GET.SUCCESS : MESSAGE.PRODUCT.GET.FAILED,
          row ?? null,
        );
      } catch (err) {
        debugError("PRODUCT:GET:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.GET.ERROR, null, err as Error);
      }
    }),
  getBySlug: publicProcedure
    .input(productContract.getBySlug.input)
    .output(productContract.getBySlug.output)
    .query(async ({ input }) => {
      try {
        const { slug } = input.params;

        const output = await db
          .select()
          .from(product)
          .where(and(eq(product.slug, slug), eq(product.isActive, true), isNull(product.deletedAt)))
          .limit(1);

        const row = output?.[0] ?? null;

        return API_RESPONSE(
          row ? STATUS.SUCCESS : STATUS.FAILED,
          row ? MESSAGE.PRODUCT.GET_BY_SLUG.SUCCESS : MESSAGE.PRODUCT.GET_BY_SLUG.FAILED,
          row ? { product: row } : null,
        );
      } catch (err) {
        debugError("PRODUCT:GET_BY_SLUG:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.GET_BY_SLUG.ERROR, null, err as Error);
      }
    }),
  getBySubcategorySlug: publicProcedure
    .input(productContract.getBySubcategorySlug.input)
    .output(productContract.getBySubcategorySlug.output)
    .query(async ({ input }) => {
      try {
        const { subcategorySlug, categorySlug } = input.params;

        const products = await db.query.product.findMany({
          where: (p, { eq, and, isNull }) =>
            and(
              eq(p.subcategorySlug, subcategorySlug),
              eq(p.categorySlug, categorySlug),
              eq(p.isActive, true),
              eq(p.status, "live"),
              isNull(p.deletedAt),
            ),
          with: {
            variants: {
              where: (pv, { isNull }) => isNull(pv.deletedAt),
            },
          },
          orderBy: (p, { desc }) => [desc(p.createdAt)],
        });

        return API_RESPONSE(
          products.length ? STATUS.SUCCESS : STATUS.FAILED,
          products.length ? MESSAGE.PRODUCT.GET_MANY.SUCCESS : MESSAGE.PRODUCT.GET_MANY.FAILED,
          products,
        );
      } catch (err) {
        debugError("PRODUCT:GET_BY_SUBCATEGORY_SLUG:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.GET_MANY.ERROR, null, err as Error);
      }
    }),
  getMany: staffProcedure
    .input(productContract.getMany.input)
    .output(productContract.getMany.output)
    .query(async ({ input }) => {
      try {
        const { query } = input;
        const { limit, offset, categorySlug, subcategorySlug, isActive, deleted, search, status } = query;

        const conditions = [];
        if (deleted === true) {
          conditions.push(not(isNull(product.deletedAt)));
        } else {
          conditions.push(isNull(product.deletedAt));
        }
        if (categorySlug) conditions.push(eq(product.categorySlug, categorySlug));
        if (subcategorySlug) conditions.push(eq(product.subcategorySlug, subcategorySlug));
        if (isActive !== undefined) conditions.push(eq(product.isActive, isActive));
        if (status) conditions.push(eq(product.status, status));
        if (search) conditions.push(ilike(product.title, `%${search}%`));

        const where = conditions.length ? and(...conditions) : undefined;

        const pageInput = {
          page: offset && limit ? Math.floor(offset / limit) + 1 : 1,
          limit: limit ?? 20,
          sortBy: undefined as string | undefined,
          sortOrder: "desc" as const,
        };

        const paging = buildPagination(pageInput);
        const effectiveOffset = offset ?? paging.offset;
        const effectiveLimit = paging.limit;

        const [{ count: totalRaw = 0 } = { count: 0 }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(product)
          .where(where);
        const total = Number(totalRaw ?? 0);

        const products = await db.query.product.findMany({
          limit: effectiveLimit,
          offset: effectiveOffset,
          where,
          orderBy: (p, { desc }) => [desc(p.createdAt)],
        });

        const metaPagination = buildPaginationMeta(total, pageInput);

        return {
          status: STATUS.SUCCESS,
          message: MESSAGE.PRODUCT.GET_MANY.SUCCESS,
          data: products,
          meta: {
            count: total,
            pagination: metaPagination,
          },
        };
      } catch (err) {
        debugError("PRODUCT:GET_MANY:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.GET_MANY.ERROR, null, err as Error);
      }
    }),
  getPDPProductByVariant: publicProcedure
    .input(productContract.getPDPProduct.input)
    .output(productContract.getPDPProduct.output)
    .query(async ({ input }) => {
      try {
        const { slug } = input.params;

        // Step 1: locate the variant by its slug
        const variant = await db.query.productVariant.findFirst({
          where: (pv, { eq, and, isNull }) => and(eq(pv.slug, slug), isNull(pv.deletedAt)),
        });

        if (!variant) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.PRODUCT.GET_PDP_PRODUCT.NOT_FOUND, null);
        }

        // Step 2: fetch the product AND all its variants
        const product = await db.query.product.findFirst({
          where: (p, { eq, and, isNull }) => and(eq(p.id, variant.productId), isNull(p.deletedAt)),
          with: {
            variants: {
              where: (pv, { eq, isNull }) => isNull(pv.deletedAt), // fetch ALL alive variants
            },
          },
        });

        if (!product) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.PRODUCT.GET_PDP_PRODUCT.FAILED, null);
        }

        return API_RESPONSE(STATUS.SUCCESS, MESSAGE.PRODUCT.GET_PDP_PRODUCT.SUCCESS, {
          product: {
            ...product,
            variants: product.variants, // full squad
          },
        });
      } catch (err) {
        debugError("PRODUCT:GET_PDP_PRODUCT:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.GET_PDP_PRODUCT.ERROR, null, err as Error);
      }
    }),
  getPDPProductByVariantFullPath: publicProcedure
    .input(productContract.getPDPProductByVariantFullPath.input)
    .output(productContract.getPDPProductByVariantFullPath.output)
    .query(async ({ input }) => {
      try {
        const { categorySlug, subcategorySlug, variantSlug } = input.params;

        // Step 1: Try to locate variant by slug
        const variant = await db.query.productVariant.findFirst({
          where: (pv, { eq, and, isNull }) => and(eq(pv.slug, variantSlug), isNull(pv.deletedAt)),
        });

        if (variant) {
          const productData = await db.query.product.findFirst({
            where: (p, { eq, and, isNull }) =>
              and(
                eq(p.id, variant.productId),
                eq(p.categorySlug, categorySlug),
                eq(p.subcategorySlug, subcategorySlug),
                eq(p.isActive, true),
                eq(p.status, "live"),
                isNull(p.deletedAt),
              ),
            with: { variants: { where: (pv, { isNull }) => isNull(pv.deletedAt) } },
          });
          if (!productData) {
            return API_RESPONSE(STATUS.FAILED, MESSAGE.PRODUCT.GET_PDP_PRODUCT.NOT_FOUND, null);
          }
          // Ensure variant matching URL is first so PDP displays correct one
          const variants = [...productData.variants];
          const matchIdx = variants.findIndex((v) => v.slug === variantSlug);
          if (matchIdx > 0) {
            const [matched] = variants.splice(matchIdx, 1);
            variants.unshift(matched);
          }
          const productPayload = { ...productData, variants };
          const seo = await loadPdpSeoForVariant(productPayload.id, variants[0]!.id);
          return API_RESPONSE(STATUS.SUCCESS, MESSAGE.PRODUCT.GET_PDP_PRODUCT.SUCCESS, {
            product: productPayload,
            seo,
          });
        }

        // Fallback: variantSlug may be product slug (product without variants)
        const found = await db.query.product.findFirst({
          where: (p, { eq, and, isNull }) =>
            and(
              eq(p.slug, variantSlug),
              eq(p.categorySlug, categorySlug),
              eq(p.subcategorySlug, subcategorySlug),
              eq(p.isActive, true),
              eq(p.status, "live"),
              isNull(p.deletedAt),
            ),
          with: { variants: { where: (pv, { isNull }) => isNull(pv.deletedAt) } },
        });

        if (!found) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.PRODUCT.GET_PDP_PRODUCT.NOT_FOUND, null);
        }

        if (found.variants.length === 0) {
          const productWithVirtualVariant = {
            ...found,
            variants: [
              {
                id: found.id,
                slug: found.slug,
                title: found.title,
                productId: found.id,
                priceModifierType: "flat_decrease" as const,
                priceModifierValue: "0",
                attributes: null as { title: string; type: string; value: string }[] | null,
                media: null as { url: string }[] | null,
                createdAt: found.createdAt,
                updatedAt: found.updatedAt,
                deletedAt: null as Date | null,
              },
            ],
          };
          const seo = await loadPdpSeoForVariant(found.id, found.id);
          return API_RESPONSE(STATUS.SUCCESS, MESSAGE.PRODUCT.GET_PDP_PRODUCT.SUCCESS, {
            product: productWithVirtualVariant,
            seo,
          });
        }

        const primaryVariant = found.variants.find((v) => v.slug === variantSlug) ?? found.variants[0] ?? null;
        if (!primaryVariant) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.PRODUCT.GET_PDP_PRODUCT.NOT_FOUND, null);
        }
        const seo = await loadPdpSeoForVariant(found.id, primaryVariant.id);
        return API_RESPONSE(STATUS.SUCCESS, MESSAGE.PRODUCT.GET_PDP_PRODUCT.SUCCESS, {
          product: found,
          seo,
        });
      } catch (err) {
        debugError("PRODUCT:GET_PDP_PRODUCT_FULL_PATH:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.GET_PDP_PRODUCT.ERROR, null, err as Error);
      }
    }),
  getProductWithProductVariants: publicProcedure
    .input(productContract.getProductWithProductVariants.input)
    .output(productContract.getProductWithProductVariants.output)
    .query(async ({ input }) => {
      try {
        const output = await db.query.product.findFirst({
          where: (c, { eq }) => eq(c.slug, input.params.slug),
          with: {
            variants: {
              orderBy: (s, { asc }) => [asc(s.createdAt)],
            },
          },
        });

        const row = output ?? null;

        return API_RESPONSE(
          row ? STATUS.SUCCESS : STATUS.FAILED,
          row ? MESSAGE.PRODUCT.GET_BY_SLUG.SUCCESS : MESSAGE.PRODUCT.GET_BY_SLUG.FAILED,
          row ? { product: row } : null,
        );
      } catch (err) {
        debugError("PRODUCT:GET_BY_SLUG:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.GET_BY_SLUG.ERROR, null, err as Error);
      }
    }),

  create: staffProcedure
    .input(productContract.create.input)
    .output(productContract.create.output)
    .mutation(async ({ input }) => {
      try {
        const now = new Date();
        const body = input.body;

        // Validate category and subcategory relationship
        const validationError = await validateCategorySubcategory(body.categorySlug, body.subcategorySlug);
        if (validationError) {
          return API_RESPONSE(STATUS.FAILED, validationError, null);
        }

        const slug = body.slug ?? body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

        // Check for duplicate slug
        const [existingSlug] = await db
          .select({ slug: product.slug })
          .from(product)
          .where(and(eq(product.slug, slug), isNull(product.deletedAt)))
          .limit(1);

        if (existingSlug) {
          return API_RESPONSE(STATUS.FAILED, "Product slug already exists", null);
        }

        const [output] = await db
          .insert(product)
          .values({
            id: uuidv4(),
            title: body.title,
            description: body.description ?? null,
            metaTitle: body.metaTitle ?? null,
            metaDescription: body.metaDescription ?? null,
            slug,

            // Relations
            categorySlug: body.categorySlug,
            subcategorySlug: body.subcategorySlug,
            taxClassId: body.taxClassId ?? null,
            tracksInventory: body.tracksInventory ?? true,

            // Pricing
            basePrice: body.basePrice,
            baseCurrency: body.baseCurrency ?? "INR",
            baseImage: body.baseImage ?? null,

            features: body.features ?? null,

            status: body.status ?? "draft",
            isActive: body.isActive ?? true,

            deletedAt: null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.PRODUCT.CREATE.SUCCESS : MESSAGE.PRODUCT.CREATE.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.CREATE.ERROR, null, err as Error);
      }
    }),
  update: staffProcedure
    .input(productContract.update.input)
    .output(productContract.update.output)
    .mutation(async ({ input }) => {
      try {
        const { params, body } = input;

        const [existingProduct] = await db
          .select()
          .from(product)
          .where(and(eq(product.id, params.id), isNull(product.deletedAt)))
          .limit(1);

        if (!existingProduct) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.PRODUCT.UPDATE.FAILED, null);
        }

        // Determine effective category/subcategory values
        const effectiveCategorySlug = body.categorySlug ?? existingProduct.categorySlug;
        const effectiveSubcategorySlug = body.subcategorySlug ?? existingProduct.subcategorySlug;

        // Validate category/subcategory if either is being updated
        if (body.categorySlug !== undefined || body.subcategorySlug !== undefined) {
          const validationError = await validateCategorySubcategory(effectiveCategorySlug, effectiveSubcategorySlug);
          if (validationError) {
            return API_RESPONSE(STATUS.FAILED, validationError, null);
          }
        }

        if (body.slug && body.slug !== existingProduct.slug) {
          const [existingSlug] = await db
            .select()
            .from(product)
            .where(and(eq(product.slug, body.slug), isNull(product.deletedAt)))
            .limit(1);

          if (existingSlug) {
            return API_RESPONSE(STATUS.FAILED, "Slug already exists", null);
          }
        }

        // Build update object dynamically
        const updateData: Record<string, unknown> = { updatedAt: new Date() };

        for (const key in body) {
          const value = body[key as keyof typeof body];
          if (value !== undefined) updateData[key] = value;
        }

        const [updatedProduct] = await db.update(product).set(updateData).where(eq(product.id, params.id)).returning();

        return API_RESPONSE(
          updatedProduct ? STATUS.SUCCESS : STATUS.FAILED,
          updatedProduct ? MESSAGE.PRODUCT.UPDATE.SUCCESS : MESSAGE.PRODUCT.UPDATE.FAILED,
          updatedProduct,
        );
      } catch (err) {
        debugError("PRODUCT:UPDATE:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.UPDATE.ERROR, null, err as Error);
      }
    }),
  delete: staffProcedure
    .input(productContract.delete.input)
    .output(productContract.delete.output)
    .mutation(async ({ input }) => {
      try {
        const [existing] = await db
          .select()
          .from(product)
          .where(and(eq(product.id, input.params.id), isNull(product.deletedAt)))
          .limit(1);

        if (!existing) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.PRODUCT.DELETE.FAILED, null);
        }

        const now = new Date();

        const [output] = await db
          .update(product)
          .set({
            deletedAt: now,
            updatedAt: now,
            slug: `${existing.slug}-deleted-${Date.now()}`,
            isActive: false,
          })
          .where(eq(product.id, input.params.id))
          .returning({ id: product.id });

        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.PRODUCT.DELETE.SUCCESS : MESSAGE.PRODUCT.DELETE.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.DELETE.ERROR, null, err as Error);
      }
    }),
  listShopCatalog: publicProcedure
    .input(productContract.listShopCatalog.input)
    .output(productContract.listShopCatalog.output)
    .query(async () => {
      try {
        const rows = await db.query.product.findMany({
          where: and(
            eq(product.categorySlug, "t-shirts"),
            eq(product.isActive, true),
            eq(product.status, "live"),
            isNull(product.deletedAt),
          ),
          with: {
            variants: {
              where: (v, { isNull: isNullV }) => isNullV(v.deletedAt),
            },
          },
          orderBy: (p, { asc }) => [asc(p.subcategorySlug), asc(p.title)],
        });

        const productIds = rows.map((r) => r.id);
        const memberships =
          productIds.length > 0
            ? await db
                .select({
                  productId: productCollection.productId,
                  collectionSlug: productCollection.collectionSlug,
                })
                .from(productCollection)
                .where(inArray(productCollection.productId, productIds))
            : [];
        const collectionsByProduct = new Map<string, string[]>();
        for (const m of memberships) {
          const list = collectionsByProduct.get(m.productId) ?? [];
          list.push(m.collectionSlug);
          collectionsByProduct.set(m.productId, list);
        }

        const variantIds = rows.flatMap((r) => r.variants.map((v) => v.id));
        const invRows =
          variantIds.length > 0
            ? await db.query.inventoryItem.findMany({
                where: and(inArray(inventoryItem.variantId, variantIds), isNull(inventoryItem.deletedAt)),
              })
            : [];
        const availableByVariant = new Map(
          invRows.map((i) => [i.variantId, Math.max(0, i.quantity - i.reserved)] as const),
        );

        const sizeOfVariant = (v: (typeof rows)[0]["variants"][0]) => {
          const attr = v.attributes?.find((a) => a.type === "size" || a.title === "Size");
          return attr?.value ?? v.title;
        };

        const items = rows.map((p) => {
          const allSizes = sortSizes(p.variants.map(sizeOfVariant));
          const sizesInStock = sortSizes(
            p.variants.filter((v) => (availableByVariant.get(v.id) ?? 0) > 0).map(sizeOfVariant),
          );

          return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            styleSlug: p.subcategorySlug,
            styleTitle: styleTitle(p.subcategorySlug),
            colorLabel: colorLabelFromProductSlug(p.slug, p.subcategorySlug),
            image: p.baseImage,
            priceMinor: p.basePrice,
            currency: p.baseCurrency ?? "INR",
            pdpPath: pdpPathForProduct(p.categorySlug, p.subcategorySlug, p.slug),
            sizesInStock,
            allSizes,
            collectionSlugs: collectionsByProduct.get(p.id) ?? [],
          };
        });

        return API_RESPONSE(
          items.length ? STATUS.SUCCESS : STATUS.FAILED,
          items.length ? MESSAGE.PRODUCT.GET_MANY.SUCCESS : MESSAGE.PRODUCT.GET_MANY.FAILED,
          items,
        );
      } catch (err) {
        debugError("PRODUCT:LIST_SHOP_CATALOG:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.GET_MANY.ERROR, [], err as Error);
      }
    }),

  search: publicProcedure
    .input(productContract.search.input)
    .output(productContract.search.output)
    .query(async ({ input }) => {
      try {
        const output = await db.query.product.findMany({
          where: and(ilike(product.title, `%${input.query.q}%`), isNull(product.deletedAt)),
          limit: input.query.limit ?? 10,
          orderBy: (p, { asc }) => [asc(p.createdAt)],
        });

        return API_RESPONSE(
          output.length ? STATUS.SUCCESS : STATUS.FAILED,
          output.length ? MESSAGE.PRODUCT.SEARCH.SUCCESS : MESSAGE.PRODUCT.SEARCH.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PRODUCT.SEARCH.ERROR, [], err as Error);
      }
    }),
});
