import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createTRPCRouter, customerProcedure, publicProcedure, staffProcedure } from "@/core/api/api.methods";
import { db } from "@/core/db/db";
import { order, payment } from "@/core/db/db.schema";
import { razorpay } from "@/core/payment/razorpay.client";
import { completeRazorpayPaymentAfterVerification } from "@/core/payment/razorpay.complete";
import { buildRazorpayOrderOptions } from "@/core/payment/razorpay.options";
import { MESSAGE, STATUS } from "@/shared/config/api.config";
import { API_RESPONSE } from "@/shared/config/api.utils";
import { buildPagination, buildPaginationMeta } from "@/shared/schema";
import { debugError } from "@/shared/utils/lib/logger.utils";
import { type Payment, type PaymentProviderMetadata, paymentContract } from "./payment.schema";

function toPaymentDto(row: {
  id: string;
  orderId: string;
  provider: string;
  status: string;
  amount: number;
  currency: string | null;
  providerPaymentId: string | null;
  providerMetadata: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
}): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    provider: row.provider as Payment["provider"],
    status: row.status as Payment["status"],
    amount: row.amount,
    currency: row.currency ?? "INR",
    providerPaymentId: row.providerPaymentId ?? undefined,
    providerMetadata: (row.providerMetadata ?? undefined) as PaymentProviderMetadata | null | undefined,
    createdAt: row.createdAt ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
  };
}

function isPgUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const o = err as { code?: string; cause?: unknown };
  if (o.code === "23505") return true;
  const c = o.cause;
  if (typeof c === "object" && c !== null && "code" in c) {
    return (c as { code?: string }).code === "23505";
  }
  return false;
}

export const paymentRouter = createTRPCRouter({
  /**
   * Get a single payment by ID (admin/staff).
   */
  get: staffProcedure
    .input(paymentContract.get.input)
    .output(paymentContract.get.output)
    .query(async ({ input }) => {
      try {
        const { id } = input.params;

        const row = await db.query.payment.findFirst({
          where: eq(payment.id, id),
        });

        if (!row) {
          return API_RESPONSE(STATUS.FAILED, "Payment not found", null);
        }

        const payload = toPaymentDto(row);
        return API_RESPONSE(STATUS.SUCCESS, "Payment retrieved", payload);
      } catch (err) {
        debugError("PAYMENT:GET:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Error retrieving payment", null, err as Error);
      }
    }),

  /**
   * Create a payment intent for an order. For Razorpay, creates a Razorpay order and returns
   * razorpayOrderId for checkout.js. Amount is taken from order.grandTotal (paise).
   */
  createIntent: publicProcedure
    .input(paymentContract.createIntent.input)
    .output(paymentContract.createIntent.output)
    .mutation(async ({ input, ctx }) => {
      try {
        const { orderId, provider } = input.body;
        const userId = ctx.user?.id ?? null;

        const orderData = await db.query.order.findFirst({
          where: eq(order.id, orderId),
        });

        if (!orderData) {
          return API_RESPONSE(STATUS.FAILED, "Order not found", null);
        }

        if (orderData.userId && orderData.userId !== userId) {
          return API_RESPONSE(STATUS.FAILED, "Unauthorized", null);
        }

        if (orderData.status !== "pending") {
          return API_RESPONSE(STATUS.FAILED, "Order is not in pending state", null);
        }

        const paymentId = uuidv4();

        if (provider === "razorpay") {
          return await db.transaction(async (tx) => {
            await tx.select().from(order).where(eq(order.id, orderId)).for("update");

            const orderLocked = await tx.query.order.findFirst({
              where: eq(order.id, orderId),
            });

            if (!orderLocked) {
              return API_RESPONSE(STATUS.FAILED, "Order not found", null);
            }

            if (orderLocked.userId && orderLocked.userId !== userId) {
              return API_RESPONSE(STATUS.FAILED, "Unauthorized", null);
            }

            if (orderLocked.status !== "pending") {
              return API_RESPONSE(STATUS.FAILED, "Order is not in pending state", null);
            }

            let existingPending = await tx.query.payment.findFirst({
              where: (p, { and: andP, eq: eqP }) =>
                andP(eqP(p.orderId, orderId), eqP(p.provider, "razorpay"), eqP(p.status, "pending")),
              orderBy: (p, { desc }) => [desc(p.createdAt)],
            });

            if (existingPending) {
              if (existingPending.amount !== orderLocked.grandTotal) {
                await tx
                  .update(payment)
                  .set({ status: "failed", updatedAt: new Date() })
                  .where(eq(payment.id, existingPending.id));
                existingPending = undefined;
              } else {
                const meta = (existingPending.providerMetadata ?? {}) as Record<string, unknown>;
                const existingRzId = typeof meta.razorpayOrderId === "string" ? meta.razorpayOrderId : undefined;
                if (existingRzId) {
                  return API_RESPONSE(STATUS.SUCCESS, "Payment intent created", {
                    payment: toPaymentDto(existingPending),
                    razorpayOrderId: existingRzId,
                  });
                }

                const optionsStale = buildRazorpayOrderOptions({
                  amount: orderLocked.grandTotal,
                  currency: orderLocked.currency ?? "INR",
                  receipt: orderId,
                  notes: { orderId },
                });
                const rzOrderStale = await razorpay.orders.create(optionsStale);
                await tx
                  .update(payment)
                  .set({
                    providerMetadata: { ...meta, razorpayOrderId: rzOrderStale.id },
                    updatedAt: new Date(),
                  })
                  .where(eq(payment.id, existingPending.id));

                const updated = await tx.query.payment.findFirst({
                  where: eq(payment.id, existingPending.id),
                });
                if (!updated) {
                  return API_RESPONSE(STATUS.ERROR, "Error creating payment intent", null);
                }
                return API_RESPONSE(STATUS.SUCCESS, "Payment intent created", {
                  payment: toPaymentDto(updated),
                  razorpayOrderId: rzOrderStale.id,
                });
              }
            }

            const options = buildRazorpayOrderOptions({
              amount: orderLocked.grandTotal,
              currency: orderLocked.currency ?? "INR",
              receipt: orderId,
              notes: { orderId },
            });
            const rzOrder = await razorpay.orders.create(options);

            try {
              const [newPayment] = await tx
                .insert(payment)
                .values({
                  id: paymentId,
                  orderId,
                  provider: "razorpay",
                  status: "pending",
                  amount: orderLocked.grandTotal,
                  currency: orderLocked.currency,
                  providerMetadata: { razorpayOrderId: rzOrder.id },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                .returning();

              return API_RESPONSE(STATUS.SUCCESS, "Payment intent created", {
                payment: toPaymentDto(newPayment),
                razorpayOrderId: rzOrder.id,
              });
            } catch (insErr) {
              if (!isPgUniqueViolation(insErr)) throw insErr;

              const row = await tx.query.payment.findFirst({
                where: (p, { and: andP, eq: eqP }) =>
                  andP(eqP(p.orderId, orderId), eqP(p.provider, "razorpay"), eqP(p.status, "pending")),
                orderBy: (p, { desc }) => [desc(p.createdAt)],
              });

              if (!row) throw insErr;

              const metaRow = (row.providerMetadata ?? {}) as { razorpayOrderId?: string };
              if (!metaRow.razorpayOrderId) throw insErr;

              return API_RESPONSE(STATUS.SUCCESS, "Payment intent created", {
                payment: toPaymentDto(row),
                razorpayOrderId: metaRow.razorpayOrderId,
              });
            }
          });
        }

        const [newPayment] = await db
          .insert(payment)
          .values({
            id: paymentId,
            orderId,
            provider,
            status: "pending",
            amount: orderData.grandTotal,
            currency: orderData.currency,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const payload = toPaymentDto(newPayment);

        return API_RESPONSE(STATUS.SUCCESS, "Payment intent created", {
          payment: payload,
          razorpayOrderId: undefined,
        });
      } catch (err) {
        debugError("PAYMENT:CREATE_INTENT:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Error creating payment intent", null, err as Error);
      }
    }),

  /**
   * Confirm a payment. For Razorpay, razorpayOrderId/razorpayPaymentId/razorpaySignature
   * must be provided; signature is verified before updating. Idempotent if already completed.
   */
  confirm: customerProcedure
    .input(paymentContract.confirm.input)
    .output(paymentContract.confirm.output)
    .mutation(async ({ input, ctx }) => {
      try {
        const { paymentId, metadata, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input.body;

        const paymentRow = await db.query.payment.findFirst({
          where: eq(payment.id, paymentId),
          with: { order: true },
        });

        if (!paymentRow || !paymentRow.order) {
          return API_RESPONSE(STATUS.FAILED, "Payment record not found", null);
        }

        if (paymentRow.order.userId && paymentRow.order.userId !== ctx.user.id) {
          return API_RESPONSE(STATUS.FAILED, "Unauthorized", null);
        }

        if (paymentRow.status === "completed") {
          return API_RESPONSE(STATUS.SUCCESS, "Payment already confirmed", toPaymentDto(paymentRow));
        }

        if (paymentRow.provider === "razorpay") {
          if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return API_RESPONSE(STATUS.FAILED, "Razorpay verification fields required", null);
          }
          const rzResult = await completeRazorpayPaymentAfterVerification({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            paymentId,
            authenticatedUserId: ctx.user.id,
            extraMetadata: metadata ?? undefined,
          });
          if (!rzResult.ok) {
            const message =
              rzResult.reason === "invalid_signature"
                ? "Invalid payment signature"
                : rzResult.reason === "forbidden"
                  ? "Unauthorized"
                  : rzResult.reason === "amount_mismatch"
                    ? "Payment amount does not match order total"
                    : rzResult.reason === "provider_error"
                      ? "Could not verify payment with Razorpay"
                      : rzResult.reason === "payment_not_successful"
                        ? "Payment was not successful"
                        : "Payment verification failed";
            return API_RESPONSE(STATUS.FAILED, message, null);
          }
          const row = await db.query.payment.findFirst({ where: eq(payment.id, paymentId) });
          if (!row) {
            return API_RESPONSE(STATUS.FAILED, "Payment record not found", null);
          }
          return API_RESPONSE(STATUS.SUCCESS, "Payment confirmed", toPaymentDto(row));
        }

        return API_RESPONSE(STATUS.FAILED, "Unsupported payment provider for confirmation", null);
      } catch (err) {
        debugError("PAYMENT:CONFIRM:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Error confirming payment", null, err as Error);
      }
    }),

  /**
   * Get payment status for an order
   */
  getStatus: customerProcedure
    .input(paymentContract.getStatus.input)
    .output(paymentContract.getStatus.output)
    .query(async ({ input, ctx }) => {
      try {
        const { orderId } = input.params;
        const orderRow = await db.query.order.findFirst({
          where: eq(order.id, orderId),
        });

        if (!orderRow || (orderRow.userId && orderRow.userId !== ctx.user.id)) {
          return API_RESPONSE(STATUS.FAILED, "Unauthorized", []);
        }

        const data = await db.query.payment.findMany({
          where: eq(payment.orderId, orderId),
          orderBy: (payment, { desc }) => [desc(payment.createdAt)],
        });

        const payload: Payment[] = data.map((p) => ({
          id: p.id,
          orderId: p.orderId,
          provider: p.provider,
          status: p.status,
          amount: p.amount,
          currency: p.currency ?? "INR",
          providerPaymentId: p.providerPaymentId ?? undefined,
          providerMetadata: (p.providerMetadata ?? undefined) as PaymentProviderMetadata | null | undefined,
          createdAt: p.createdAt ?? undefined,
          updatedAt: p.updatedAt ?? undefined,
        }));

        return API_RESPONSE(STATUS.SUCCESS, "Payment status retrieved", payload);
      } catch (err) {
        debugError("PAYMENT:GET_STATUS:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Error retrieving payment status", [], err as Error);
      }
    }),

  /**
   * Admin: Get all payments with pagination and filtering
   */
  getManyAdmin: staffProcedure
    .input(paymentContract.getManyAdmin.input)
    .output(paymentContract.getManyAdmin.output)
    .query(async ({ input }) => {
      try {
        const query = {
          page: 1,
          limit: 20,
          sortOrder: "desc" as const,
          status: undefined as Payment["status"] | undefined,
          provider: undefined as Payment["provider"] | undefined,
          q: undefined as string | undefined,
          ...input.query,
        };
        const { status, provider, q } = query;

        const pageInput = {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder ?? "desc",
        };

        const paging = buildPagination(pageInput);
        const offset = paging.offset;
        const limit = paging.limit;

        // Build where conditions using drizzle top-level helpers
        const whereConditions = [
          status ? eq(payment.status, status) : undefined,
          provider ? eq(payment.provider, provider) : undefined,
          q ? ilike(payment.orderId, `%${q}%`) : undefined,
        ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));

        const where = whereConditions.length ? and(...whereConditions) : undefined;

        const [{ count: totalRaw = 0 } = { count: 0 }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(payment)
          .where(where);
        const total = Number(totalRaw ?? 0);

        const data = await db.query.payment.findMany({
          where,
          orderBy: (p, { desc }) => [desc(p.createdAt)],
          limit,
          offset,
          with: {
            order: true,
          },
        });

        const metaPagination = buildPaginationMeta(total, pageInput);

        const formattedData = data.map((p) => ({
          ...p,
          providerMetadata: (p.providerMetadata ?? undefined) as Record<string, unknown> | null | undefined,
        }));

        return {
          status: STATUS.SUCCESS,
          message: MESSAGE.PAYMENT.GET_MANY.SUCCESS,
          data: formattedData,
          meta: {
            count: total,
            pagination: metaPagination,
          },
        };
      } catch (err) {
        debugError("PAYMENT:GET_MANY_ADMIN:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.PAYMENT.GET_MANY.ERROR, [], err as Error);
      }
    }),
});
