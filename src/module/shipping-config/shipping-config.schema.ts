import { z } from "zod/v3";
import { addressSnapshotSchema } from "@/module/order/order.schema";
import { detailedResponse, offsetPaginationSchema } from "@/shared/schema";

// ---------------------------------------------
// Shared types
// ---------------------------------------------

export const shippingOptionSchema = z.object({
  providerId: z.string(),
  methodId: z.string(),
  providerName: z.string(),
  methodName: z.string(),
  price: z.number().int(),
  etaDays: z.number().int().nullable().optional(),
});

export type ShippingOption = z.infer<typeof shippingOptionSchema>;

// ---------------------------------------------
// Provider
// ---------------------------------------------

export const shippingProviderSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).nullable().optional(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export const shippingProviderInsertSchema = shippingProviderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const shippingProviderUpdateSchema = shippingProviderInsertSchema.partial();

// ---------------------------------------------
// Method
// ---------------------------------------------

export const shippingMethodSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean().default(true),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export const shippingMethodInsertSchema = shippingMethodSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const shippingMethodUpdateSchema = shippingMethodInsertSchema.partial();

// ---------------------------------------------
// Zone
// ---------------------------------------------

export const shippingZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  countryCode: z.string().min(1),
  regionCode: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export const shippingZoneInsertSchema = shippingZoneSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const shippingZoneUpdateSchema = shippingZoneInsertSchema.partial();

// ---------------------------------------------
// Rate rule (flat price + optional free-over threshold)
// ---------------------------------------------

export const shippingRateRuleSchema = z.object({
  id: z.string().min(1),
  methodId: z.string().min(1),
  zoneId: z.string().min(1),
  price: z.number().int(), // in smallest currency unit
  // optional cart value threshold for free shipping (smallest unit)
  freeShippingMinOrderValue: z.number().int().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export const shippingRateRuleInsertSchema = shippingRateRuleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const shippingRateRuleUpdateSchema = shippingRateRuleInsertSchema.partial();

// ---------------------------------------------
// Input contracts
// ---------------------------------------------

export const shippingOptionsInputSchema = z.object({
  body: z
    .object({
      shippingAddressId: z.string().min(1).optional(),
      shippingAddress: addressSnapshotSchema.optional(),
    })
    .refine((b) => Boolean(b.shippingAddressId || b.shippingAddress), {
      message: "Shipping address is required to load options",
    }),
});

export const shippingProviderListInputSchema = z.object({
  query: offsetPaginationSchema.optional(),
});

export const shippingMethodListInputSchema = z.object({
  query: offsetPaginationSchema
    .extend({
      providerId: z.string().optional(),
    })
    .optional(),
});

export const shippingZoneListInputSchema = z.object({
  query: offsetPaginationSchema.optional(),
});

export const shippingRateRuleListInputSchema = z.object({
  query: offsetPaginationSchema
    .extend({
      providerId: z.string().optional(),
      methodId: z.string().optional(),
      zoneId: z.string().optional(),
    })
    .optional(),
});

// ---------------------------------------------
// Contracts
// ---------------------------------------------

export const shippingConfigContract = {
  getOptions: {
    input: shippingOptionsInputSchema,
    output: detailedResponse(z.array(shippingOptionSchema)),
  },
  provider: {
    list: {
      input: shippingProviderListInputSchema.optional(),
      output: detailedResponse(z.array(shippingProviderSchema)),
    },
    create: {
      input: z.object({ body: shippingProviderInsertSchema }),
      output: detailedResponse(shippingProviderSchema),
    },
    update: {
      input: z.object({
        params: z.object({ id: z.string().min(1) }),
        body: shippingProviderUpdateSchema,
      }),
      output: detailedResponse(shippingProviderSchema),
    },
  },
  method: {
    list: {
      input: shippingMethodListInputSchema.optional(),
      output: detailedResponse(z.array(shippingMethodSchema)),
    },
    create: {
      input: z.object({ body: shippingMethodInsertSchema }),
      output: detailedResponse(shippingMethodSchema),
    },
    update: {
      input: z.object({
        params: z.object({ id: z.string().min(1) }),
        body: shippingMethodUpdateSchema,
      }),
      output: detailedResponse(shippingMethodSchema),
    },
  },
  zone: {
    list: {
      input: shippingZoneListInputSchema.optional(),
      output: detailedResponse(z.array(shippingZoneSchema)),
    },
    create: {
      input: z.object({ body: shippingZoneInsertSchema }),
      output: detailedResponse(shippingZoneSchema),
    },
    update: {
      input: z.object({
        params: z.object({ id: z.string().min(1) }),
        body: shippingZoneUpdateSchema,
      }),
      output: detailedResponse(shippingZoneSchema),
    },
  },
  rateRule: {
    list: {
      input: shippingRateRuleListInputSchema.optional(),
      output: detailedResponse(z.array(shippingRateRuleSchema)),
    },
    create: {
      input: z.object({ body: shippingRateRuleInsertSchema }),
      output: detailedResponse(shippingRateRuleSchema),
    },
    update: {
      input: z.object({
        params: z.object({ id: z.string().min(1) }),
        body: shippingRateRuleUpdateSchema,
      }),
      output: detailedResponse(shippingRateRuleSchema),
    },
  },
};
