import z from "zod/v3";
import { detailedResponse, offsetPaginationSchema } from "@/shared/schema";
import { productVariantBaseSchema } from "../product-variant/product-variant.schema";

export const baseProductSchema = z.object({
  id: z.string().min(1),

  title: z.string().min(1),
  description: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  slug: z.string().min(1),

  // RELATIONS
  categorySlug: z.string().min(1),
  subcategorySlug: z.string().min(1),
  taxClassId: z.string().nullable().optional(),
  tracksInventory: z.boolean().default(true),

  // PRICING (currency field stores string; coerce for API/DB)
  basePrice: z.coerce.number().min(0),
  baseCurrency: z.string().default("INR").nullable(),
  baseImage: z.string().nullable().optional(),

  // FEATURES
  features: z
    .array(z.object({ title: z.string() }))
    .nullable()
    .optional(),

  // STATE
  isActive: z.boolean().default(true).nullable(),
  status: z.enum(["draft", "archive", "live"]).default("draft"),

  // SYSTEM
  deletedAt: z.date().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z
    .date()
    .default(() => new Date())
    .nullable(),
});

export const productSelectSchema = baseProductSchema;

export const productInsertSchema = baseProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const productUpdateSchema = baseProductSchema.partial();

//
// SEARCH + PAGINATION
//
const searchSchema = z.object({
  search: z.string().min(2).max(100).optional(),
  status: z.enum(["draft", "archive", "live"]).optional(),
});

export const productContract = {
  get: {
    input: z.object({
      params: z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
      }),
    }),
    output: detailedResponse(productSelectSchema.nullable()),
  },
  getBySubcategorySlug: {
    input: z.object({
      params: z.object({
        subcategorySlug: z.string().min(1),
        categorySlug: z.string().min(1),
      }),
    }),
    output: detailedResponse(
      z.array(
        productSelectSchema.extend({
          variants: z.array(productVariantBaseSchema),
        }),
      ),
    ),
  },
  getBySlug: {
    input: z.object({
      params: z.object({
        slug: z.string().min(1),
      }),
    }),
    output: detailedResponse(
      z
        .object({
          product: productSelectSchema,
        })
        .nullable(),
    ),
  },
  getMany: {
    input: z.object({
      query: offsetPaginationSchema
        .extend({
          categorySlug: z.string().optional(),
          subcategorySlug: z.string().optional(),
          isActive: z.boolean().optional(),
          deleted: z.boolean().optional(),
        })
        .extend({
          search: z.string().optional(),
          status: z.enum(["draft", "archive", "live"]).optional(),
        }),
    }),
    output: detailedResponse(z.array(productSelectSchema)),
  },
  getPDPProduct: {
    input: z.object({
      params: z.object({
        slug: z.string().min(1),
      }),
    }),
    output: detailedResponse(
      z
        .object({
          product: productSelectSchema.extend({
            variants: z.array(productVariantBaseSchema),
          }),
        })
        .nullable(),
    ),
  },
  getPDPByProductSlug: {
    input: z.object({
      params: z.object({
        slug: z.string().min(1),
      }),
    }),
    output: detailedResponse(
      z
        .object({
          product: productSelectSchema.extend({
            variants: z.array(productVariantBaseSchema),
          }),
          seo: z.object({
            reviewAggregate: z
              .object({
                ratingValue: z.number(),
                reviewCount: z.number(),
              })
              .nullable(),
            reviewsForSchema: z
              .array(
                z.object({
                  ratingValue: z.number().int().min(1).max(5),
                  reviewBody: z.string(),
                  datePublished: z.string(),
                }),
              )
              .optional(),
            variantInventory: z
              .object({
                sku: z.string().nullable(),
                availableQuantity: z.number(),
                barcode: z.string().nullable().optional(),
              })
              .nullable(),
          }),
        })
        .nullable(),
    ),
  },
  getPDPProductByVariantFullPath: {
    input: z.object({
      params: z.object({
        categorySlug: z.string().min(1),
        subcategorySlug: z.string().min(1),
        variantSlug: z.string().min(1),
      }),
    }),
    output: detailedResponse(
      z
        .object({
          product: productSelectSchema.extend({
            variants: z.array(productVariantBaseSchema),
          }),
          seo: z.object({
            reviewAggregate: z
              .object({
                ratingValue: z.number(),
                reviewCount: z.number(),
              })
              .nullable(),
            /** Approved reviews (first page, same cap as storefront UI) for JSON-LD */
            reviewsForSchema: z
              .array(
                z.object({
                  ratingValue: z.number().int().min(1).max(5),
                  reviewBody: z.string(),
                  datePublished: z.string(),
                }),
              )
              .optional(),
            variantInventory: z
              .object({
                sku: z.string().nullable(),
                availableQuantity: z.number(),
                barcode: z.string().nullable().optional(),
              })
              .nullable(),
          }),
        })
        .nullable(),
    ),
  },
  getProductWithProductVariants: {
    input: z.object({
      params: z.object({
        slug: z.string().min(1),
      }),
    }),
    output: detailedResponse(
      z.object({
        product: productSelectSchema.extend({
          variants: z.array(
            productVariantBaseSchema.pick({
              id: true,
              slug: true,
              title: true,
              productId: true,
              priceModifierType: true,
              priceModifierValue: true,
              attributes: true,
              media: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
            }),
          ),
        }),
      }),
    ),
  },

  create: {
    input: z.object({
      body: productInsertSchema,
    }),
    output: detailedResponse(productSelectSchema),
  },

  update: {
    input: z.object({
      params: z.object({ id: z.string() }),
      body: productUpdateSchema,
    }),
    output: detailedResponse(productSelectSchema),
  },

  delete: {
    input: z.object({
      params: z.object({ id: z.string() }),
    }),
    output: detailedResponse(productSelectSchema.pick({ id: true }).nullable()),
  },

  listShopCatalog: {
    input: z.object({}).optional(),
    output: detailedResponse(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          slug: z.string(),
          styleSlug: z.string(),
          styleTitle: z.string(),
          colorLabel: z.string(),
          image: z.string().nullable(),
          priceMinor: z.number(),
          currency: z.string(),
          pdpPath: z.string(),
          sizesInStock: z.array(z.string()),
          allSizes: z.array(z.string()),
          collectionSlugs: z.array(z.string()),
        }),
      ),
    ),
  },
  search: {
    input: z.object({
      query: offsetPaginationSchema.extend({
        q: z.string().min(2),
      }),
    }),
    output: detailedResponse(z.array(productSelectSchema)),
  },
};
