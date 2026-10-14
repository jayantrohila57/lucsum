import { z } from "zod/v3";
import { detailedResponse, paginationInput } from "@/shared/schema";

export const orderStatusEnum = z.enum(["pending", "paid", "shipped", "delivered", "returned", "cancelled"]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

export const addressSnapshotSchema = z.object({
  fullName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
});

export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  variantId: z.string(),
  productTitle: z.string(),
  variantTitle: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int(),
  totalPrice: z.number().int(),
  attributes: z
    .array(
      z.object({
        title: z.string(),
        type: z.string(),
        value: z.string(),
      }),
    )
    .nullable()
    .optional(),
});

export const orderBaseSchema = z.object({
  id: z.string().min(1),
  userId: z.string().nullable().optional(),
  status: orderStatusEnum,
  subtotal: z.number().int(),
  discountTotal: z.number().int().default(0),
  taxTotal: z.number().int().default(0),
  shippingTotal: z.number().int().default(0),
  grandTotal: z.number().int(),
  currency: z.string().default("INR"),
  shippingProviderId: z.string().nullable().optional(),
  shippingMethodId: z.string().nullable().optional(),
  shippingZoneId: z.string().nullable().optional(),
  warehouseId: z.string().nullable().optional(),
  shippingAddress: addressSnapshotSchema,
  billingAddress: addressSnapshotSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  placedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
});

const orderUserSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

export const orderSelectSchema = orderBaseSchema.extend({
  items: z.array(orderItemSchema).optional(),
  user: orderUserSnapshotSchema.nullable().optional(),
});

export const orderCreateInputSchema = z.object({
  cartId: z.string().optional(), // If provided, convert from cart
  // Deprecated: ignored for cart resolution — use cartId or default user cart; guest carts use cart_session_id cookie.
  sessionId: z.string().optional(),
  shippingAddressId: z.string().optional(), // If using existing address
  shippingAddress: addressSnapshotSchema.optional(), // Or providing descriptive address
  billingAddressId: z.string().optional(),
  billingAddress: addressSnapshotSchema.optional(),
  notes: z.string().optional(),
  shippingProviderId: z.string().min(1),
  shippingMethodId: z.string().min(1),
  /**
   * Optional discount/coupon code entered at checkout.
   */
  discountCode: z.string().min(1).optional(),
});

export const orderUpdateStatusSchema = z.object({
  status: orderStatusEnum,
  notes: z.string().optional(),
});

export const orderContract = {
  get: {
    input: z.object({
      params: z.object({ id: z.string().min(1) }),
    }),
    output: detailedResponse(orderSelectSchema),
  },
  getMany: {
    input: z
      .object({
        query: paginationInput.optional(),
      })
      .optional(),
    output: detailedResponse(z.array(orderSelectSchema)),
  },
  getManyAdmin: {
    input: z.object({
      query: paginationInput
        .extend({
          status: orderStatusEnum.optional(),
          customerType: z.enum(["registered", "guest"]).optional(),
          q: z.string().optional(),
          shippingProviderPresence: z.enum(["assigned", "unassigned"]).optional(),
          shippingMethodPresence: z.enum(["assigned", "unassigned"]).optional(),
          shippingZonePresence: z.enum(["assigned", "unassigned"]).optional(),
          warehousePresence: z.enum(["assigned", "unassigned"]).optional(),
        })
        .optional(),
    }),
    output: detailedResponse(z.array(orderSelectSchema)),
  },
  create: {
    input: z.object({
      body: orderCreateInputSchema,
    }),
    output: detailedResponse(orderSelectSchema),
  },
  /** Server-authoritative totals for checkout UI; must match order.create + Razorpay amount. */
  previewCheckoutTotals: {
    input: z.object({
      body: z.object({
        cartId: z.string().optional(),
        shippingAddressId: z.string().min(1).optional(),
        shippingAddress: addressSnapshotSchema.optional(),
        shippingProviderId: z.string().min(1),
        shippingMethodId: z.string().min(1),
        discountCode: z.string().optional(),
      }),
    }),
    output: detailedResponse(
      z.object({
        subtotal: z.number().int(),
        discountTotal: z.number().int(),
        shippingTotal: z.number().int(),
        taxTotal: z.number().int(),
        grandTotal: z.number().int(),
        currency: z.string(),
      }),
    ),
  },
  updateStatus: {
    input: z.object({
      params: z.object({ id: z.string().min(1) }),
      body: orderUpdateStatusSchema,
    }),
    output: detailedResponse(orderSelectSchema),
  },
};

export type Order = z.infer<typeof orderSelectSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateInputSchema>;
