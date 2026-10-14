import { and, eq, ilike, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createTRPCRouter, customerProcedure, publicProcedure, staffProcedure } from "@/core/api/api.methods";
import { APP_ROLE, normalizeRole } from "@/core/auth/auth.roles";
import { db } from "@/core/db/db";
import { address, cart, cartLine, inventoryItem, order, orderItem, user as userTable } from "@/core/db/db.schema";
import { applyInventoryDelta, type InventoryDbLike } from "@/module/inventory/inventory.api";
import {
  computeCheckoutTotals,
  type PricingDb,
  persistDiscountInTransaction,
} from "@/module/order/checkout-pricing.service";
import { notifyLowStock, notifyOrderStatusChange } from "@/shared/components/mail/notification.service";
import { MESSAGE, STATUS } from "@/shared/config/api.config";
import { API_RESPONSE } from "@/shared/config/api.utils";
import { buildPagination, buildPaginationMeta } from "@/shared/schema";
import { debugError } from "@/shared/utils/lib/logger.utils";
import { type Order, type OrderStatus, orderContract } from "./order.schema";

class CheckoutValidationError extends Error {
  override readonly name = "CheckoutValidationError";
}

export const orderRouter = createTRPCRouter({
  /**
   * Get order by ID
   */
  get: customerProcedure
    .input(orderContract.get.input)
    .output(orderContract.get.output)
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.user.id;
        const { id } = input.params;

        const data = await db.query.order.findFirst({
          where: eq(order.id, id),
          with: {
            items: true,
            user: true,
          },
        });

        if (!data) {
          return API_RESPONSE(STATUS.FAILED, MESSAGE.ORDER.GET.FAILED, null);
        }

        const role = normalizeRole(ctx.user.role);
        const isPrivileged = role === APP_ROLE.ADMIN || role === APP_ROLE.STAFF;
        if (!isPrivileged) {
          if (!data.userId || data.userId !== userId) {
            return API_RESPONSE(STATUS.FAILED, "Unauthorized", null);
          }
        }

        return API_RESPONSE(STATUS.SUCCESS, MESSAGE.ORDER.GET.SUCCESS, data);
      } catch (err) {
        debugError("ORDER:GET:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, MESSAGE.ORDER.GET.ERROR, null, err as Error);
      }
    }),

  /**
   * Get current user's orders
   */
  getMany: customerProcedure
    .input(orderContract.getMany.input)
    .output(orderContract.getMany.output)
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user.id;
        const data = await db.query.order.findMany({
          where: eq(order.userId, userId),
          orderBy: (orderTable, { desc }) => [desc(orderTable.placedAt)],
          with: {
            items: true,
            user: true,
          },
        });

        return API_RESPONSE(STATUS.SUCCESS, "Orders retrieved successfully", data);
      } catch (err) {
        debugError("ORDER:GET_MANY:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Error retrieving orders", [], err as Error);
      }
    }),

  /**
   * Admin/staff: list all orders with pagination & optional filters
   */
  getManyAdmin: staffProcedure
    .input(orderContract.getManyAdmin.input)
    .output(orderContract.getManyAdmin.output)
    .query(async ({ input }) => {
      try {
        const query = {
          page: 1,
          limit: 20,
          sortOrder: "desc" as const,
          status: undefined as OrderStatus | undefined,
          customerType: undefined as "registered" | "guest" | undefined,
          q: undefined as string | undefined,
          shippingProviderPresence: undefined as "assigned" | "unassigned" | undefined,
          shippingMethodPresence: undefined as "assigned" | "unassigned" | undefined,
          shippingZonePresence: undefined as "assigned" | "unassigned" | undefined,
          warehousePresence: undefined as "assigned" | "unassigned" | undefined,
          ...input.query,
        };
        const {
          status,
          q,
          customerType,
          shippingProviderPresence,
          shippingMethodPresence,
          shippingZonePresence,
          warehousePresence,
        } = query;

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
          status ? eq(order.status, status) : undefined,
          customerType === "registered" ? sql`${order.userId} IS NOT NULL` : undefined,
          customerType === "guest" ? sql`${order.userId} IS NULL` : undefined,
          q ? ilike(order.id, `%${q}%`) : undefined,
          shippingProviderPresence === "assigned" ? isNotNull(order.shippingProviderId) : undefined,
          shippingProviderPresence === "unassigned" ? isNull(order.shippingProviderId) : undefined,
          shippingMethodPresence === "assigned" ? isNotNull(order.shippingMethodId) : undefined,
          shippingMethodPresence === "unassigned" ? isNull(order.shippingMethodId) : undefined,
          shippingZonePresence === "assigned" ? isNotNull(order.shippingZoneId) : undefined,
          shippingZonePresence === "unassigned" ? isNull(order.shippingZoneId) : undefined,
          warehousePresence === "assigned" ? isNotNull(order.warehouseId) : undefined,
          warehousePresence === "unassigned" ? isNull(order.warehouseId) : undefined,
        ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));

        const where = whereConditions.length ? and(...whereConditions) : undefined;

        const [{ count: totalRaw = 0 } = { count: 0 }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(order)
          .where(where);
        const total = Number(totalRaw ?? 0);

        const data = await db.query.order.findMany({
          where,
          orderBy: (o, { desc }) => [desc(o.placedAt)],
          limit,
          offset,
          with: {
            user: true,
          },
        });

        const metaPagination = buildPaginationMeta(total, pageInput);

        return {
          status: STATUS.SUCCESS,
          message: "Orders retrieved successfully",
          data,
          meta: {
            count: total,
            pagination: metaPagination,
          },
        };
      } catch (err) {
        debugError("ORDER:GET_MANY_ADMIN:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Error retrieving orders", [], err as Error);
      }
    }),

  /**
   * Server-authoritative checkout totals (shipping, discount, tax) for UI parity with order.create.
   */
  previewCheckoutTotals: publicProcedure
    .input(orderContract.previewCheckoutTotals.input)
    .output(orderContract.previewCheckoutTotals.output)
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.user?.id;
        const { cartId, shippingAddressId, shippingAddress, shippingProviderId, shippingMethodId, discountCode } =
          input.body;

        let shippingSnapshot = shippingAddress;
        if (!shippingSnapshot) {
          if (!userId || !shippingAddressId) {
            return API_RESPONSE(STATUS.FAILED, "Shipping address is required", null);
          }
          const addr = await db.query.address.findFirst({
            where: eq(address.id, shippingAddressId),
          });
          if (!addr || addr.userId !== userId) {
            return API_RESPONSE(STATUS.FAILED, "Invalid shipping address", null);
          }
          shippingSnapshot = {
            fullName: "Customer",
            line1: addr.line1,
            line2: addr.line2 ?? "",
            city: addr.city,
            state: addr.state,
            postalCode: addr.postalCode,
            country: addr.country,
          };
        }

        const cartWithLines = {
          with: {
            lines: {
              with: {
                variant: { with: { product: true } },
              },
            },
          },
        } as const;

        const cartData = cartId
          ? await db.query.cart.findFirst({
              where: eq(cart.id, cartId),
              ...cartWithLines,
            })
          : userId
            ? await db.query.cart.findFirst({
                where: eq(cart.userId, userId),
                ...cartWithLines,
              })
            : ctx.guestCartSessionId
              ? await db.query.cart.findFirst({
                  where: eq(cart.sessionId, ctx.guestCartSessionId),
                  ...cartWithLines,
                })
              : null;

        if (!cartData?.lines.length) {
          return API_RESPONSE(STATUS.FAILED, "Cart is empty", null);
        }
        if (cartData.userId && cartData.userId !== userId) {
          return API_RESPONSE(STATUS.FAILED, "Unauthorized cart access", null);
        }
        if (!cartData.userId) {
          if (!ctx.guestCartSessionId || cartData.sessionId !== ctx.guestCartSessionId) {
            return API_RESPONSE(STATUS.FAILED, "Unauthorized cart access", null);
          }
        }

        const lines = cartData.lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
          unitPrice: line.price,
          variantTaxClassId: line.variant.taxClassId,
          productTaxClassId: line.variant.product.taxClassId,
        }));

        const totals = await computeCheckoutTotals(db, {
          lines,
          shippingAddress: {
            country: shippingSnapshot.country,
            state: shippingSnapshot.state,
            city: shippingSnapshot.city,
            postalCode: shippingSnapshot.postalCode,
          },
          shippingProviderId,
          shippingMethodId,
          discountCode,
          userId: userId ?? "",
          preview: true,
        });

        if (!totals.ok) {
          return API_RESPONSE(STATUS.FAILED, totals.message, null);
        }

        const { subtotal, discountTotal, shippingTotal, taxTotal, grandTotal, currency } = totals.data;
        return API_RESPONSE(STATUS.SUCCESS, "Totals computed", {
          subtotal,
          discountTotal,
          shippingTotal,
          taxTotal,
          grandTotal,
          currency,
        });
      } catch (err) {
        debugError("ORDER:PREVIEW_CHECKOUT_TOTALS:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Error computing checkout totals", null, err as Error);
      }
    }),

  /**
   * Create order from cart
   */
  create: publicProcedure
    .input(orderContract.create.input)
    .output(orderContract.create.output)
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user?.id ?? null;
        const { cartId, shippingAddress, billingAddress, notes, shippingProviderId, shippingMethodId, discountCode } =
          input.body;

        const cartLinesWithProduct = {
          with: {
            lines: {
              with: {
                variant: {
                  with: {
                    product: true,
                  },
                },
              },
            },
          },
        } as const;

        const cartData = cartId
          ? await db.query.cart.findFirst({
              where: eq(cart.id, cartId),
              ...cartLinesWithProduct,
            })
          : userId
            ? await db.query.cart.findFirst({
                where: eq(cart.userId, userId),
                ...cartLinesWithProduct,
              })
            : ctx.guestCartSessionId
              ? await db.query.cart.findFirst({
                  where: eq(cart.sessionId, ctx.guestCartSessionId),
                  ...cartLinesWithProduct,
                })
              : null;

        if (!cartData || cartData.lines.length === 0) {
          return API_RESPONSE(STATUS.FAILED, "Cart is empty", null);
        }

        if (cartData.userId && cartData.userId !== userId) {
          return API_RESPONSE(STATUS.FAILED, "Unauthorized cart access", null);
        }
        if (!cartData.userId) {
          if (!ctx.guestCartSessionId || cartData.sessionId !== ctx.guestCartSessionId) {
            return API_RESPONSE(STATUS.FAILED, "Unauthorized cart access", null);
          }
        }

        if (!shippingAddress) {
          return API_RESPONSE(STATUS.FAILED, "Shipping address is required", null);
        }

        const pricingLines = cartData.lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
          unitPrice: line.price,
          variantTaxClassId: line.variant.taxClassId,
          productTaxClassId: line.variant.product.taxClassId,
        }));

        // Start transaction — totals computed inside for consistency with cart + rates
        const result = await db.transaction(async (tx) => {
          const txDb = tx as unknown as PricingDb;
          const totalsResult = await computeCheckoutTotals(txDb, {
            lines: pricingLines,
            shippingAddress,
            shippingProviderId,
            shippingMethodId,
            discountCode,
            userId: userId ?? "",
            preview: false,
          });

          if (!totalsResult.ok) {
            throw new CheckoutValidationError(totalsResult.message);
          }

          const { subtotal, discountTotal, shippingTotal, taxTotal, grandTotal, shippingZoneId, appliedDiscount } =
            totalsResult.data;

          const orderId = uuidv4();

          const orderItemsData = cartData.lines.map((line) => {
            const lineTotal = line.price * line.quantity;
            return {
              id: uuidv4(),
              orderId,
              variantId: line.variantId,
              productTitle: line.variant.product.title,
              variantTitle: line.variant.title,
              quantity: line.quantity,
              unitPrice: line.price,
              totalPrice: lineTotal,
              attributes: line.variant.attributes,
              createdAt: new Date(),
            };
          });

          const [newOrder] = await tx
            .insert(order)
            .values({
              id: orderId,
              userId: userId || null,
              status: "pending",
              subtotal,
              discountTotal,
              taxTotal,
              shippingTotal,
              grandTotal,
              currency: "INR",
              shippingProviderId,
              shippingMethodId,
              shippingZoneId,
              shippingAddress: shippingAddress,
              billingAddress: billingAddress || shippingAddress,
              notes: notes || null,
              placedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          if (discountCode?.trim() && appliedDiscount) {
            const persisted = await persistDiscountInTransaction(txDb, {
              discountCode: discountCode.trim(),
              subtotal,
              orderId,
              userId: userId ?? "",
              currency: "INR",
            });
            if (!persisted) {
              throw new CheckoutValidationError("Discount could not be applied");
            }
          }

          await tx.insert(orderItem).values(orderItemsData);

          for (const item of orderItemsData) {
            const cartLineRow = cartData.lines.find((l) => l.variantId === item.variantId);
            const tracksInventory = cartLineRow?.variant.product.tracksInventory !== false;

            const inventoryRow = await tx.query.inventoryItem.findFirst({
              where: (inv, { and, eq: eqLocal, isNull }) =>
                and(eqLocal(inv.variantId, item.variantId), isNull(inv.deletedAt)),
            });

            if (tracksInventory) {
              if (!inventoryRow) {
                throw new CheckoutValidationError(
                  `No inventory record for variant ${item.variantTitle}. Cannot complete order.`,
                );
              }

              await applyInventoryDelta(tx as InventoryDbLike, {
                inventoryId: inventoryRow.id,
                quantityDelta: -item.quantity,
                reservedDelta: -item.quantity,
                type: "order",
                warehouseId: inventoryRow.warehouseId,
                variantId: inventoryRow.variantId,
                orderId,
                refundId: null,
                reason: "Order placed",
                adjustedBy: userId,
              });
            }
          }

          await tx.delete(cartLine).where(eq(cartLine.cartId, cartData.id));
          await tx.update(cart).set({ updatedAt: new Date() }).where(eq(cart.id, cartData.id));

          return { ...newOrder, items: orderItemsData };
        });

        // 8. Upgrade role from user -> customer on first checkout
        if (ctx.user && userId) {
          const currentRole = normalizeRole(ctx.user.role);
          if (currentRole === APP_ROLE.USER) {
            await db.update(userTable).set({ role: APP_ROLE.CUSTOMER }).where(eq(userTable.id, userId));
          }
        }

        // 8. Low stock alerts (fire-and-forget)
        const variantIds = [...new Set(result.items.map((i) => i.variantId))];
        if (variantIds.length > 0) {
          const inventories = await db.query.inventoryItem.findMany({
            where: inArray(inventoryItem.variantId, variantIds),
          });
          for (const inv of inventories) {
            if (inv.quantity > 10) continue;
            const item = result.items.find((i) => i.variantId === inv.variantId);
            if (!item) continue;
            notifyLowStock({
              variantId: inv.variantId,
              currentStock: inv.quantity,
              productName: item.productTitle,
              variantTitle: item.variantTitle,
              sku: inv.sku ?? undefined,
            }).catch((err) => debugError("ORDER:CREATE:LOW_STOCK_ALERT:ERROR", err));
          }
        }

        return API_RESPONSE(STATUS.SUCCESS, MESSAGE.ORDER.CREATE.SUCCESS, result);
      } catch (err) {
        if (err instanceof CheckoutValidationError) {
          return API_RESPONSE(STATUS.FAILED, err.message, null);
        }
        debugError("ORDER:CREATE:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Error placing order", null, err as Error);
      }
    }),

  /**
   * Update order status (Admin only or system)
   */
  updateStatus: staffProcedure
    .input(orderContract.updateStatus.input)
    .output(orderContract.updateStatus.output)
    .mutation(async ({ input }) => {
      try {
        const { id } = input.params;
        const { status: newStatus } = input.body;

        const existingOrder = await db.query.order.findFirst({
          where: eq(order.id, id),
          with: { user: true },
        });
        if (!existingOrder) {
          return API_RESPONSE(STATUS.FAILED, "Order not found", null);
        }
        const oldStatus = existingOrder.status;

        const [updatedOrder] = await db
          .update(order)
          .set({
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(order.id, id))
          .returning();

        if (!updatedOrder) {
          return API_RESPONSE(STATUS.FAILED, "Order not found", null);
        }

        if (oldStatus !== newStatus && existingOrder.userId) {
          await notifyOrderStatusChange(id, oldStatus, newStatus);
        }

        return API_RESPONSE(STATUS.SUCCESS, MESSAGE.ORDER.UPDATE.SUCCESS, updatedOrder);
      } catch (err) {
        debugError("ORDER:UPDATE_STATUS:ERROR", err);
        return API_RESPONSE(STATUS.ERROR, "Error updating order status", null, err as Error);
      }
    }),
});
