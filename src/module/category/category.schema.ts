import z from "zod/v3";
import { subcategorySelectSchema } from "@/module/subcategory/subcategory.schema";
import { detailedResponse, paginationInput, visibilityEnum } from "@/shared/schema";

export const displayTypeEnum = z.enum(["grid", "carousel", "banner", "list", "featured"]);

export const categoryBaseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  icon: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  displayType: displayTypeEnum.default("grid"),
  color: z.string().default("#FFFFFF").nullable(),
  visibility: visibilityEnum.default("public"),
  displayOrder: z.number().int().default(0),
  image: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
  deletedAt: z.date().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z
    .date()
    .default(() => new Date())
    .nullable(),
});

export const categorySelectSchema = categoryBaseSchema;

export const categoryInsertSchema = categoryBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const categoryUpdateSchema = categoryBaseSchema.partial();

const searchSchema = z.object({
  search: z.string().min(2).max(100).optional(),
  visibility: z.enum(["public", "private", "hidden"]).optional(),
  isFeatured: z.boolean().optional(),
  displayType: displayTypeEnum.optional(),
  deleted: z.boolean().optional(),
  color: z.string().optional(),
  /** When true (default), public listings only return LUCSUM catalogue roots. */
  catalogOnly: z.boolean().optional(),
});

export const categoryContract = {
  get: {
    input: z.object({
      params: z.object({
        id: z.string().min(1).optional(),
        slug: z.string().optional(),
      }),
    }),
    output: detailedResponse(categorySelectSchema.nullable()),
  },

  getMany: {
    input: z.object({
      query: searchSchema.merge(paginationInput).optional(),
    }),
    output: detailedResponse(z.array(categorySelectSchema)),
  },
  getAllFeaturedCategories: {
    input: z.object({}).optional(),
    output: detailedResponse(z.array(categorySelectSchema)),
  },
  getManyWithSubcategories: {
    input: z.object({
      query: searchSchema.merge(paginationInput).optional(),
    }),
    output: detailedResponse(
      z.array(
        categorySelectSchema.extend({
          subcategories: z.array(subcategorySelectSchema).optional(),
        }),
      ),
    ),
  },

  getManyByTypes: {
    input: z.object({
      query: searchSchema.merge(paginationInput).optional(),
    }),
    output: detailedResponse(
      z.object({
        featuredCategoryType: z.array(categorySelectSchema),
        categoryVisibility: z.object({
          publicCategoryType: z.array(categorySelectSchema),
          privateCategoryType: z.array(categorySelectSchema),
          hiddenCategoryType: z.array(categorySelectSchema),
        }),
        recentCategoryType: z.array(categorySelectSchema),
        deletedCategoryType: z.array(categorySelectSchema),
      }),
    ),
  },

  getCategoryWithSubCategories: {
    input: z.object({
      params: z.object({
        slug: z.string().min(1),
      }),
    }),
    output: detailedResponse(
      categorySelectSchema
        .extend({
          subcategories: z.array(subcategorySelectSchema).optional(),
        })
        .nullable(),
    ),
  },

  create: {
    input: z.object({
      body: categoryInsertSchema,
    }),
    output: detailedResponse(categorySelectSchema),
  },

  update: {
    input: z.object({
      params: z.object({ id: z.string() }),
      body: categoryUpdateSchema,
    }),
    output: detailedResponse(categorySelectSchema),
  },

  delete: {
    input: z.object({
      params: z.object({ id: z.string() }),
    }),
    output: detailedResponse(categorySelectSchema.pick({ id: true }).nullable()),
  },
};
