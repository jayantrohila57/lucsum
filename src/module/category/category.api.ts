import { and, eq, ilike, inArray, isNull, not, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createTRPCRouter, publicProcedure, staffProcedure } from "@/core/api/api.methods";
import { db } from "@/core/db/db";
import { category, product } from "@/core/db/db.schema";
import { MESSAGE, STATUS } from "@/shared/config/api.config";
import { API_RESPONSE } from "@/shared/config/api.utils";
import { isLucsumCatalogCategorySlug, LUCSUM_CATALOG_CATEGORY_SLUGS } from "@/shared/config/catalog";
import { buildPagination, buildPaginationMeta } from "@/shared/schema";
import { debugError } from "@/shared/utils/lib/logger.utils";
import { categoryContract } from "./category.schema";

export const categoryRouter = createTRPCRouter({
  get: publicProcedure
    .input(categoryContract.get.input)
    .output(categoryContract.get.output)
    .query(async ({ input }) => {
      try {
        const output = await db.query.category.findFirst({
          where: (c, { eq }) => {
            if (input.params?.id) return eq(c.id, String(input.params.id));
            if (input.params?.slug) return eq(c.slug, String(input.params.slug));
            return undefined;
          },
        });
        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.CATEGORY.GET.SUCCESS : MESSAGE.CATEGORY.GET.FAILED,
          output ?? null,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.CATEGORY.GET.ERROR, null, err as Error);
      }
    }),

  getMany: publicProcedure
    .input(categoryContract.getMany.input)
    .output(categoryContract.getMany.output)
    .query(async ({ input }) => {
      try {
        const conditions = [];
        if (input.query?.search) conditions.push(ilike(category.title, `%${input.query.search}%`));
        if (input.query?.visibility) conditions.push(eq(category.visibility, input.query.visibility));
        if (input.query?.isFeatured !== undefined) conditions.push(eq(category.isFeatured, input.query.isFeatured));
        if (input.query?.displayType) conditions.push(eq(category.displayType, input.query.displayType));
        if (input.query?.color) conditions.push(eq(category.color, input.query.color));

        // Default to non-deleted results unless explicitly requested
        if (input.query?.deleted === true) {
          conditions.push(not(isNull(category.deletedAt)));
        } else {
          conditions.push(isNull(category.deletedAt));
        }

        if (input.query?.catalogOnly !== false) {
          conditions.push(inArray(category.slug, [...LUCSUM_CATALOG_CATEGORY_SLUGS]));
        }

        const where = conditions.length ? and(...conditions) : undefined;

        const pageInput = {
          page: input.query?.page ?? 1,
          limit: input.query?.limit ?? 20,
          sortBy: input.query?.sortBy,
          sortOrder: input.query?.sortOrder ?? "desc",
        };

        const paging = buildPagination(pageInput);
        const offset = paging.offset;
        const limit = paging.limit;

        const [{ count: totalRaw = 0 } = { count: 0 }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(category)
          .where(where);
        const total = Number(totalRaw ?? 0);

        const output = await db.query.category.findMany({
          where,
          limit,
          offset,
          orderBy: (c, { asc }) => [asc(c.displayOrder)],
        });

        const metaPagination = buildPaginationMeta(total, pageInput);

        return {
          status: output?.length ? STATUS.SUCCESS : STATUS.FAILED,
          message: output?.length ? MESSAGE.CATEGORY.GET_MANY.SUCCESS : MESSAGE.CATEGORY.GET_MANY.FAILED,
          data: output,
          meta: {
            count: total,
            pagination: metaPagination,
            filters: {
              visibility: input.query?.visibility,
              isFeatured: input.query?.isFeatured,
              displayType: input.query?.displayType,
              color: input.query?.color,
              deleted: input.query?.deleted ?? false,
              search: input.query?.search,
            },
          },
        };
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.CATEGORY.GET_MANY.ERROR, null, err as Error);
      }
    }),
  getAllFeaturedCategories: publicProcedure
    .input(categoryContract.getAllFeaturedCategories.input)
    .output(categoryContract.getAllFeaturedCategories.output)
    .query(async () => {
      try {
        const output = await db.query.category.findMany({
          where: (c, { eq, and, isNull }) =>
            and(eq(c.isFeatured, true), isNull(c.deletedAt), inArray(c.slug, [...LUCSUM_CATALOG_CATEGORY_SLUGS])),
          orderBy: (c, { asc }) => [asc(c.displayOrder)],
        });

        return API_RESPONSE(
          output?.length ? STATUS.SUCCESS : STATUS.FAILED,
          output?.length ? MESSAGE.CATEGORY.GET_ALL_FEATURED.SUCCESS : MESSAGE.CATEGORY.GET_ALL_FEATURED.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.CATEGORY.GET_ALL_FEATURED.ERROR, null, err as Error);
      }
    }),

  getManyWithSubcategories: publicProcedure
    .input(categoryContract.getManyWithSubcategories.input)
    .output(categoryContract.getManyWithSubcategories.output)
    .query(async ({ input }) => {
      try {
        const conditions = [];
        if (input.query?.search) conditions.push(ilike(category.title, `%${input.query.search}%`));
        if (input.query?.visibility) conditions.push(eq(category.visibility, input.query.visibility));
        if (input.query?.isFeatured !== undefined) conditions.push(eq(category.isFeatured, input.query.isFeatured));
        conditions.push(isNull(category.deletedAt));
        if (input.query?.catalogOnly !== false) {
          conditions.push(inArray(category.slug, [...LUCSUM_CATALOG_CATEGORY_SLUGS]));
        }
        const where = conditions.length ? and(...conditions) : undefined;

        const output = await db.query.category.findMany({
          where,
          limit: input.query?.limit ?? 50,
          offset: input.query?.offset ?? 0,
          orderBy: (c, { asc }) => [asc(c.displayOrder)],
          with: {
            subcategories: {
              where: (sc, { isNull: isNullSub }) => isNullSub(sc.deletedAt),
              orderBy: (sc, { asc }) => [asc(sc.displayOrder)],
            },
          },
        });

        return API_RESPONSE(
          output?.length ? STATUS.SUCCESS : STATUS.FAILED,
          output?.length
            ? MESSAGE.CATEGORY.GET_MANY_WITH_SUBCATEGORIES.SUCCESS
            : MESSAGE.CATEGORY.GET_MANY_WITH_SUBCATEGORIES.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.CATEGORY.GET_MANY_WITH_SUBCATEGORIES.ERROR, null, err as Error);
      }
    }),

  getManyByTypes: publicProcedure
    .input(categoryContract.getManyByTypes.input)
    .output(categoryContract.getManyByTypes.output)
    .query(async ({}) => {
      try {
        const featuredCategories = await db.query.category.findMany({
          where: (c, { eq, and, isNull }) => and(eq(c.isFeatured, true), isNull(c.deletedAt)),
        });
        const [publicCategories, privateCategories, hiddenCategories] = await Promise.all([
          db.query.category.findMany({
            where: (c, { eq, and, isNull }) => and(eq(c.visibility, "public"), isNull(c.deletedAt)),
          }),
          db.query.category.findMany({
            where: (c, { eq, and, isNull }) => and(eq(c.visibility, "private"), isNull(c.deletedAt)),
          }),
          db.query.category.findMany({
            where: (c, { eq, and, isNull }) => and(eq(c.visibility, "hidden"), isNull(c.deletedAt)),
          }),
        ]);
        const recentCategories = await db.query.category.findMany({
          where: (c, { and, isNull }) => and(isNull(c.deletedAt)),
          limit: 10,
        });

        // Get soft-deleted categories
        const deletedCategories = await db.query.category.findMany({
          where: (c, { and, not, isNull }) => and(not(isNull(c.deletedAt))),
        });
        const output = {
          featuredCategoryType: featuredCategories,
          categoryVisibility: {
            publicCategoryType: publicCategories,
            privateCategoryType: privateCategories,
            hiddenCategoryType: hiddenCategories,
          },
          recentCategoryType: recentCategories,
          deletedCategoryType: deletedCategories,
        };
        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.CATEGORY.GET_MANY.SUCCESS : MESSAGE.CATEGORY.GET_MANY.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.CATEGORY.GET_MANY.ERROR, null, err as Error);
      }
    }),

  getCategoryWithSubCategories: publicProcedure
    .input(categoryContract.getCategoryWithSubCategories.input)
    .output(categoryContract.getCategoryWithSubCategories.output)
    .query(async ({ input }) => {
      try {
        const slug = input.params.slug;
        if (!isLucsumCatalogCategorySlug(slug)) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.CATEGORY.GET_BY_SLUG.FAILED, null);
        }

        const responseData = await db.query.category.findFirst({
          where: (c, { eq, and, isNull }) => and(eq(c.slug, slug), isNull(c.deletedAt)),
          with: {
            subcategories: {
              where: (s, { isNull: isNullSub }) => isNullSub(s.deletedAt),
              orderBy: (s, { asc }) => [asc(s.displayOrder)],
            },
          },
        });

        if (!responseData) return API_RESPONSE(STATUS.FAILED, MESSAGE.CATEGORY.GET_BY_SLUG.FAILED, null);

        const subs = responseData.subcategories ?? [];
        const enrichedSubs = await Promise.all(
          subs.map(async (sub) => {
            if (sub.image) return sub;
            const sample = await db.query.product.findFirst({
              where: and(
                eq(product.categorySlug, slug),
                eq(product.subcategorySlug, sub.slug),
                eq(product.isActive, true),
                eq(product.status, "live"),
                isNull(product.deletedAt),
              ),
              columns: { baseImage: true },
              orderBy: (p, { asc }) => [asc(p.title)],
            });
            if (!sample?.baseImage) return sub;
            return { ...sub, image: sample.baseImage };
          }),
        );

        return API_RESPONSE(STATUS.SUCCESS, MESSAGE.CATEGORY.GET_BY_SLUG.SUCCESS, {
          ...responseData,
          subcategories: enrichedSubs,
        });
      } catch (err) {
        debugError("CATEGORY:GET_BY_SLUG:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.CATEGORY.GET_BY_SLUG.ERROR, null, err as Error);
      }
    }),

  create: staffProcedure
    .input(categoryContract.create.input)
    .output(categoryContract.create.output)
    .mutation(async ({ input }) => {
      try {
        const [output] = await await db
          .insert(category)
          .values({
            id: uuidv4(),
            slug: input.body.slug ?? input.body.title.toLowerCase().replace(/\s+/g, "-"),
            title: input.body.title,
            description: input.body.description ?? null,
            color: input.body.color ?? null,
            displayType: input.body.displayType ?? "grid",
            visibility: input.body.visibility ?? "public",
            displayOrder: input.body.displayOrder ?? 0,
            image: input.body.image ?? null,
            isFeatured: input.body.isFeatured ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.CATEGORY.CREATE.SUCCESS : MESSAGE.CATEGORY.CREATE.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.CATEGORY.CREATE.ERROR, null, err as Error);
      }
    }),

  update: staffProcedure
    .input(categoryContract.update.input)
    .output(categoryContract.update.output)
    .mutation(async ({ input }) => {
      try {
        const { params, body } = input;

        // Check if category exists
        const existingCategory = await db.query.category.findFirst({
          where: eq(category.id, params.id),
        });

        if (!existingCategory) {
          return API_RESPONSE(STATUS.FAILED, "Category not found", null);
        }

        // Check for duplicate slug if it's being updated
        if (body.slug && body.slug !== existingCategory.slug) {
          const existingSlug = await db.query.category.findFirst({
            where: and(eq(category.slug, body.slug), eq(category.id, params.id)),
          });

          if (existingSlug) {
            return API_RESPONSE(STATUS.FAILED, "A category with this slug already exists", null);
          }
        }

        // Prepare update data
        const updateData = {
          title: body.title ?? existingCategory.title,
          slug: body.slug ?? existingCategory.slug,
          description: body.description ?? existingCategory.description,
          color: body.color ?? existingCategory.color,
          displayType: body.displayType ?? existingCategory.displayType,
          visibility: body.visibility ?? existingCategory.visibility,
          displayOrder: body.displayOrder ?? existingCategory.displayOrder,
          image: body.image ?? existingCategory.image,
          isFeatured: body.isFeatured ?? existingCategory.isFeatured,
          updatedAt: new Date(),
        };

        // Perform the update
        const [updatedCategory] = await db
          .update(category)
          .set(updateData)
          .where(eq(category.id, params.id))
          .returning();

        if (!updatedCategory) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.CATEGORY.UPDATE.FAILED, null);
        }

        return API_RESPONSE(STATUS.SUCCESS, MESSAGE.CATEGORY.UPDATE.SUCCESS, updatedCategory);
      } catch (err) {
        debugError("CATEGORY:UPDATE:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.CATEGORY.UPDATE.ERROR, null, err as Error);
      }
    }),

  delete: staffProcedure
    .input(categoryContract.delete.input)
    .output(categoryContract.delete.output)
    .mutation(async ({ input }) => {
      try {
        const [output] = await db
          .update(category)
          .set({ deletedAt: new Date() })
          .where(eq(category.id, String(input.params.id)))
          .returning({ id: category.id });
        return API_RESPONSE(
          output ? STATUS.SUCCESS : STATUS.FAILED,
          output ? MESSAGE.CATEGORY.DELETE.SUCCESS : MESSAGE.CATEGORY.DELETE.FAILED,
          output,
        );
      } catch (err) {
        return API_RESPONSE(STATUS.ERROR, MESSAGE.CATEGORY.DELETE.ERROR, null, err as Error);
      }
    }),
});
