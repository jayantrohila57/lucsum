import { z } from "zod/v3";
import { addressSnapshotSchema, orderSelectSchema } from "@/module/order/order.schema";
import { paymentSelectSchema } from "@/module/payment/payment.schema";

/** Checkout form body – address selection and order options */
export const checkoutFormBodySchema = z
  .object({
    shippingAddressId: z.string().optional(),
    guestShipping: addressSnapshotSchema.optional(),
    guestEmail: z.string().email("Enter a valid email for your receipt").optional(),
    billingAddressId: z.string().optional(),
    sameAsShipping: z.boolean().default(true),
    notes: z.string().max(500).optional(),
    shippingProviderId: z.string().min(1, "Delivery method is required"),
    shippingMethodId: z.string().min(1, "Delivery method is required"),
    discountCode: z.string().optional(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .superRefine((data, ctx) => {
    if (!data.shippingAddressId && !data.guestShipping) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Shipping address is required",
        path: ["guestShipping"],
      });
    }
    if (!data.shippingAddressId && !data.guestEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for guest checkout",
        path: ["guestEmail"],
      });
    }
  });

/** Full checkout form input (wraps body for Form component consistency) */
export const checkoutFormSchema = z.object({
  body: checkoutFormBodySchema,
});

/** Result of initiating checkout (order + payment intent for Razorpay) */
export const checkoutInitResultSchema = z.object({
  order: orderSelectSchema.extend({ accessToken: z.string().optional() }),
  payment: paymentSelectSchema,
  razorpayOrderId: z.string().optional(),
});

export type CheckoutFormBody = z.infer<typeof checkoutFormBodySchema>;
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CheckoutInitResult = z.infer<typeof checkoutInitResultSchema>;
