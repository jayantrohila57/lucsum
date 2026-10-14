import { and, eq, ilike, inArray, isNull, not } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createTRPCRouter, publicProcedure, staffProcedure } from "@/core/api/api.methods";
import { db } from "@/core/db/db";
import { product, productCollection, type productVariant, subcategory } from "@/core/db/db.schema";
import { MESSAGE, STATUS } from "@/shared/config/api.config";
import { API_RESPONSE } from "@/shared/config/api.utils";
import { subcategoryContract } from "./subcategory.schema";

function variantsAreSizesOnly(variants: { attributes: { title: string; type: string; value: string }[] | null }[]) {
  if (variants.length === 0) return false;
  return variants.every((v) => {
    const attrs = v.attributes ?? [];
    return attrs.length > 0 && attrs.every((a) => a.type === "size" || a.title === "Size");
  });
}

const computePrice = (basePrice: number, priceModifierValue: string, priceModifierType: string): number => {
  const base = basePrice;
  const val = Number(priceModifierValue);

  switch (priceModifierType) {
    case "flat_increase":
      return base + val;
    case "flat_decrease":
      return base - val;
    case "percent_increase":
      return base + Math.round((base * val) / 100);
    case "percent_decrease":
      return base - Math.round((base * val) / 100);
    default:
      return base;
  }
};

export const subcategoryRouter = createTRPCRouter({
  get: publicProcedure
    .input(subcategoryContract.get.input)
    .output(subcategoryContract.get.output)
    .query(async ({ input }) => {
      try {
        const { id, slug, categorySlug } = input.params;

        // Must provide either id or (slug + categorySlug)
        if (!id && (!slug || !categorySlug)) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.SUBCATEGORY.GET_BY_SLUG.FAILED, null);
        }

        const conditions = [isNull(subcategory.deletedAt)];

        if (id) {
          conditions.push(eq(subcategory.id, id));
        }
        if (slug) {
          conditions.push(eq(subcategory.slug, slug));
        }
        if (categorySlug) {
          conditions.push(eq(subcategory.categorySlug, categorySlug));
        }

        const output = await db.query.subcategory.findFirst({
          where: and(...conditions),
        });

        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.SUBCATEGORY.GET_BY_SLUG.SUCCESS : MESSAGE.SUBCATEGORY.GET_BY_SLUG.FAILED,
          output ?? null,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.SUBCATEGORY.GET_BY_SLUG.ERROR, null, err as Error);
      }
    }),

  getMany: publicProcedure
    .input(subcategoryContract.getMany.input)
    .output(subcategoryContract.getMany.output)
    .query(async ({ input }) => {
      try {
        const conditions = [];
        if (input.query?.search) conditions.push(ilike(subcategory.title, `%${input.query.search}%`));
        if (input.query?.visibility) conditions.push(eq(subcategory.visibility, input.query.visibility));
        if (input.query?.isFeatured !== undefined) conditions.push(eq(subcategory.isFeatured, input.query.isFeatured));
        if (input.query?.categorySlug) conditions.push(eq(subcategory.categorySlug, input.query.categorySlug));
        // Exclude soft-deleted subcategories by default
        if (input.query?.deleted !== true) {
          conditions.push(isNull(subcategory.deletedAt));
        }

        const output = await db.query.subcategory.findMany({
          where: conditions.length ? and(...conditions) : undefined,
          limit: input.query?.limit ?? 50,
          offset: input.query?.offset ?? 0,
          orderBy: (s, { asc }) => [asc(s.displayOrder)],
        });

        return API_RESPONSE(
          output?.length ? STATUS.SUCCESS : STATUS.FAILED,
          output?.length ? MESSAGE.SUBCATEGORY.GET_MANY.SUCCESS : MESSAGE.SUBCATEGORY.GET_MANY.FAILED,
          output ?? [],
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.SUBCATEGORY.GET_MANY.ERROR, [], err as Error);
      }
    }),

  getBySlug: publicProcedure
    .input(subcategoryContract.getBySlug.input)
    .output(subcategoryContract.getBySlug.output)
    .query(async ({ input }) => {
      try {
        const { slug, categorySlug } = input.params;
        if (!slug || !categorySlug) return API_RESPONSE(STATUS.FAILED, MESSAGE.SUBCATEGORY.GET_BY_SLUG.FAILED, null);

        const subcategoryData = await db.query.subcategory.findFirst({
          where: (s, { eq, and }) => and(eq(s.slug, slug), eq(s.categorySlug, categorySlug)),
        });

        if (!subcategoryData) return API_RESPONSE(STATUS.FAILED, MESSAGE.SUBCATEGORY.GET_BY_SLUG.FAILED, null);

        const liveProductBase = and(eq(product.isActive, true), eq(product.status, "live"), isNull(product.deletedAt));

        const liveProductFilter = subcategoryData.collectionSlug
          ? liveProductBase
          : and(eq(product.categorySlug, categorySlug), eq(product.subcategorySlug, slug), liveProductBase);

        type ProductWithVariants = typeof product.$inferSelect & {
          variants: (typeof productVariant.$inferSelect)[];
        };
        let productsRaw: ProductWithVariants[] = [];

        if (subcategoryData.collectionSlug) {
          const members = await db
            .select({ productId: productCollection.productId })
            .from(productCollection)
            .where(eq(productCollection.collectionSlug, subcategoryData.collectionSlug));
          const productIds = members.map((m) => m.productId);
          productsRaw =
            productIds.length === 0
              ? []
              : await db.query.product.findMany({
                  where: and(inArray(product.id, productIds), liveProductFilter),
                  with: {
                    variants: {
                      where: (pv, { isNull: isNullPv }) => isNullPv(pv.deletedAt),
                    },
                  },
                  orderBy: (p, { desc }) => [desc(p.createdAt)],
                });
        } else {
          productsRaw = await db.query.product.findMany({
            where: and(eq(product.subcategorySlug, slug), liveProductFilter),
            with: {
              variants: {
                where: (pv, { isNull: isNullPv }) => isNullPv(pv.deletedAt),
              },
            },
            orderBy: (p, { desc }) => [desc(p.createdAt)],
          });
        }

        // Flatten variants for grid cards (one card per colour product when variants are sizes only)
        const flattenedVariants = [];
        for (const productRow of productsRaw) {
          if (productRow.variants.length > 0 && variantsAreSizesOnly(productRow.variants)) {
            const displayVariant = productRow.variants[0]!;
            flattenedVariants.push({
              id: displayVariant.id,
              slug: productRow.slug,
              title: productRow.title,
              priceModifierType: displayVariant.priceModifierType,
              priceModifierValue: displayVariant.priceModifierValue,
              attributes: displayVariant.attributes,
              media: displayVariant.media?.length ? displayVariant.media : [{ url: productRow.baseImage ?? "" }],
              productId: productRow.id,
              productTitle: productRow.title,
              productSlug: productRow.slug,
              productDescription: productRow.description,
              productBasePrice: productRow.basePrice,
              productBaseImage: productRow.baseImage,
              finalPrice: computePrice(
                productRow.basePrice,
                displayVariant.priceModifierValue,
                displayVariant.priceModifierType,
              ),
            });
            continue;
          }

          if (productRow.variants.length > 0) {
            for (const variant of productRow.variants) {
              flattenedVariants.push({
                id: variant.id,
                slug: variant.slug,
                title: variant.title,
                priceModifierType: variant.priceModifierType,
                priceModifierValue: variant.priceModifierValue,
                attributes: variant.attributes,
                media: variant.media,
                productId: productRow.id,
                productTitle: productRow.title,
                productSlug: productRow.slug,
                productDescription: productRow.description,
                productBasePrice: productRow.basePrice,
                productBaseImage: productRow.baseImage,
                finalPrice: computePrice(productRow.basePrice, variant.priceModifierValue, variant.priceModifierType),
              });
            }
          } else {
            // Product without variants: add as virtual entry using product slug
            flattenedVariants.push({
              id: productRow.id,
              slug: productRow.slug,
              title: productRow.title,
              priceModifierType: "flat_decrease",
              priceModifierValue: "0",
              attributes: null,
              media: null,
              productId: productRow.id,
              productTitle: productRow.title,
              productSlug: productRow.slug,
              productDescription: productRow.description,
              productBasePrice: productRow.basePrice,
              productBaseImage: productRow.baseImage,
              finalPrice: productRow.basePrice,
            });
          }
        }

        return API_RESPONSE(STATUS.SUCCESS, MESSAGE.SUBCATEGORY.GET_BY_SLUG.SUCCESS, {
          subcategoryData,
          variants: flattenedVariants,
        });
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.SUBCATEGORY.GET_BY_SLUG.ERROR, null, err as Error);
      }
    }),

  create: staffProcedure
    .input(subcategoryContract.create.input)
    .output(subcategoryContract.create.output)
    .mutation(async ({ input }) => {
      try {
        const [output] = await db
          .insert(subcategory)
          .values({
            id: uuidv4(),
            categorySlug: input.body.categorySlug,
            slug: input.body.slug ?? input.body.title.toLowerCase().replace(/\s+/g, "-"),
            title: input.body.title,
            description: input.body.description ?? null,
            icon: input.body.icon ?? null,
            color: input.body.color ?? null,
            displayType: input.body.displayType ?? "grid",
            visibility: input.body.visibility ?? "public",
            displayOrder: input.body.displayOrder ?? 0,
            image: input.body.image ?? null,
            isFeatured: input.body.isFeatured ?? false,
            metaTitle: input.body.metaTitle ?? null,
            metaDescription: input.body.metaDescription ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.SUBCATEGORY.CREATE.SUCCESS : MESSAGE.SUBCATEGORY.CREATE.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.SUBCATEGORY.CREATE.ERROR, null, err as Error);
      }
    }),

  update: staffProcedure
    .input(subcategoryContract.update.input)
    .output(subcategoryContract.update.output)
    .mutation(async ({ input }) => {
      try {
        const [output] = await db
          .update(subcategory)
          .set({
            title: input.body.title ?? undefined,
            slug: input.body.slug ?? undefined,
            description: input.body.description ?? undefined,
            icon: input.body.icon ?? undefined,
            color: input.body.color ?? undefined,
            displayType: input.body.displayType ?? undefined,
            visibility: input.body.visibility ?? undefined,
            displayOrder: input.body.displayOrder ?? undefined,
            image: input.body.image ?? undefined,
            isFeatured: input.body.isFeatured ?? undefined,
            metaTitle: input.body.metaTitle ?? undefined,
            metaDescription: input.body.metaDescription ?? undefined,
            updatedAt: new Date(),
          })
          .where(eq(subcategory.id, String(input.params.id)))
          .returning();

        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.SUBCATEGORY.UPDATE.SUCCESS : MESSAGE.SUBCATEGORY.UPDATE.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.SUBCATEGORY.UPDATE.ERROR, null, err as Error);
      }
    }),

  delete: staffProcedure
    .input(subcategoryContract.delete.input)
    .output(subcategoryContract.delete.output)
    .mutation(async ({ input }) => {
      try {
        const [output] = await db
          .update(subcategory)
          .set({ deletedAt: new Date() })
          .where(eq(subcategory.id, String(input.params.id)))
          .returning({ id: subcategory.id });

        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.SUBCATEGORY.DELETE.SUCCESS : MESSAGE.SUBCATEGORY.DELETE.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.SUBCATEGORY.DELETE.ERROR, null, err as Error);
      }
    }),

  getAvailable: publicProcedure
    .input(subcategoryContract.getAvailable.input)
    .output(subcategoryContract.getAvailable.output)
    .query(async ({ input }) => {
      try {
        const conditions = [
          not(eq(subcategory.categorySlug, input.query.excludeCategorySlug)),
          isNull(subcategory.deletedAt),
        ];

        if (input.query?.search) {
          conditions.push(ilike(subcategory.title, `%${input.query.search}%`));
        }

        const output = await db.query.subcategory.findMany({
          where: and(...conditions),
          orderBy: (s, { asc }) => [asc(s.displayOrder), asc(s.title)],
        });

        return API_RESPONSE(
          output?.length ? STATUS.SUCCESS : STATUS.FAILED,
          output?.length ? MESSAGE.SUBCATEGORY.GET_MANY.SUCCESS : MESSAGE.SUBCATEGORY.GET_MANY.FAILED,
          output ?? [],
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.SUBCATEGORY.GET_MANY.ERROR, null, err as Error);
      }
    }),

  transfer: staffProcedure
    .input(subcategoryContract.transfer.input)
    .output(subcategoryContract.transfer.output)
    .mutation(async ({ input }) => {
      try {
        const subcategoryId = String(input.params.id);
        const newCategorySlug = input.body.categorySlug;

        // Get the subcategory to transfer
        const [subcat] = await db
          .select({ slug: subcategory.slug, categorySlug: subcategory.categorySlug })
          .from(subcategory)
          .where(and(eq(subcategory.id, subcategoryId), isNull(subcategory.deletedAt)))
          .limit(1);

        if (!subcat) {
          return API_RESPONSE(STATUS.FAILED, "Subcategory not found", null);
        }

        // Get all linked products to track them for the update
        const linkedProducts = await db
          .select({ id: product.id })
          .from(product)
          .where(
            and(
              eq(product.subcategorySlug, subcat.slug),
              eq(product.categorySlug, subcat.categorySlug),
              isNull(product.deletedAt),
            ),
          );

        // Perform the transfer in a transaction:
        // 1. Update the subcategory's categorySlug
        // 2. Update all linked products' categorySlug to match
        const result = await db.transaction(async (tx) => {
          // Update subcategory
          const [updatedSubcategory] = await tx
            .update(subcategory)
            .set({
              categorySlug: newCategorySlug,
              updatedAt: new Date(),
            })
            .where(eq(subcategory.id, subcategoryId))
            .returning();

          // Update linked products' categorySlug to stay in sync
          if (linkedProducts.length > 0 && updatedSubcategory) {
            await tx
              .update(product)
              .set({
                categorySlug: newCategorySlug,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(product.subcategorySlug, subcat.slug),
                  eq(product.categorySlug, subcat.categorySlug),
                  isNull(product.deletedAt),
                ),
              );
          }

          return updatedSubcategory;
        });

        return API_RESPONSE(
          result ? STATUS.SUCCESS : STATUS.FAILED,
          result ? MESSAGE.SUBCATEGORY.UPDATE.SUCCESS : MESSAGE.SUBCATEGORY.UPDATE.FAILED,
          result,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.SUBCATEGORY.UPDATE.ERROR, null, err as Error);
      }
    }),
});
