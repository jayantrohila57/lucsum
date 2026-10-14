import "server-only";

import { eq, or } from "drizzle-orm";
import { db } from "@/core/db/db";
import { order, shipment, user as userTable } from "@/core/db/db.schema";
import { createOrderAccessToken } from "@/module/order/order-access-token";
import { guestEmailFromOrderNotes } from "@/module/order/order-notes";
import { PATH } from "@/shared/config/routes";
import { siteConfig } from "@/shared/config/site";
import { debugError } from "@/shared/utils/lib/logger.utils";
import {
  sendLowStockAlertEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendShipmentNotificationEmail,
} from "./mail.methods";

const LOW_STOCK_THRESHOLD = 10;

export async function notifyOrderConfirmation(orderId: string): Promise<void> {
  try {
    const orderWithDetails = await db.query.order.findFirst({
      where: eq(order.id, orderId),
      with: { items: true, user: true },
    });
    if (!orderWithDetails?.shippingAddress) return;

    const guestEmail = guestEmailFromOrderNotes(orderWithDetails.notes);
    const recipientEmail = orderWithDetails.user?.email ?? guestEmail;
    if (!recipientEmail) return;
    const addr = orderWithDetails.shippingAddress as {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    const baseUrl = siteConfig.urls?.base ?? "";
    const token = createOrderAccessToken(orderWithDetails.id);
    const orderPath = token
      ? `${PATH.ORDERS.DETAIL(orderWithDetails.id)}?token=${encodeURIComponent(token)}`
      : PATH.ORDERS.DETAIL(orderWithDetails.id);
    await sendOrderConfirmationEmail({
      user: {
        name:
          orderWithDetails.user?.name ??
          (orderWithDetails.shippingAddress as { fullName?: string }).fullName ??
          "Customer",
        email: recipientEmail,
      },
      orderNumber: orderWithDetails.id.slice(0, 8),
      items: (orderWithDetails.items ?? []).map((item) => ({
        name: item.productTitle,
        quantity: item.quantity,
        price: `₹${(Number(item.unitPrice) / 100).toFixed(2)}`,
        variant: item.variantTitle ?? undefined,
      })),
      total: `₹${(Number(orderWithDetails.grandTotal) / 100).toFixed(2)}`,
      shippingAddress: {
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
      },
      orderUrl: baseUrl ? `${baseUrl}${orderPath}` : undefined,
    });
  } catch (err) {
    debugError("NOTIFICATION:ORDER_CONFIRMATION:ERROR", err);
  }
}

export async function notifyShipmentUpdate(shipmentId: string): Promise<void> {
  try {
    const shipmentRow = await db.query.shipment.findFirst({
      where: eq(shipment.id, shipmentId),
      with: { order: { with: { user: true } } },
    });
    if (!shipmentRow?.order?.userId || !shipmentRow.order.user) return;
    const baseUrl = siteConfig.urls?.base ?? "";
    await sendShipmentNotificationEmail({
      user: { name: shipmentRow.order.user.name ?? "Customer", email: shipmentRow.order.user.email },
      orderNumber: shipmentRow.orderId.slice(0, 8),
      trackingNumber: shipmentRow.trackingNumber ?? "",
      carrier: shipmentRow.carrier ?? undefined,
      status: shipmentRow.status,
      estimatedDelivery: shipmentRow.estimatedDeliveryAt
        ? new Date(shipmentRow.estimatedDeliveryAt).toLocaleDateString()
        : undefined,
      orderUrl: baseUrl ? `${baseUrl}${PATH.ACCOUNT.ORDER}/${shipmentRow.orderId}` : undefined,
    });
  } catch (err) {
    debugError("NOTIFICATION:SHIPMENT_UPDATE:ERROR", err);
  }
}

export async function notifyOrderStatusChange(orderId: string, _oldStatus: string, newStatus: string): Promise<void> {
  try {
    const orderWithUser = await db.query.order.findFirst({
      where: eq(order.id, orderId),
      with: { user: true },
    });
    if (!orderWithUser?.userId || !orderWithUser.user) return;
    const baseUrl = siteConfig.urls?.base ?? "";
    await sendOrderStatusEmail({
      user: { name: orderWithUser.user.name ?? "Customer", email: orderWithUser.user.email },
      orderNumber: orderId.slice(0, 8),
      newStatus,
      orderUrl: baseUrl ? `${baseUrl}${PATH.ACCOUNT.ORDER}/${orderId}` : undefined,
    });
  } catch (err) {
    debugError("NOTIFICATION:ORDER_STATUS_CHANGE:ERROR", err);
  }
}

export async function notifyLowStock(params: {
  variantId: string;
  currentStock: number;
  productName: string;
  variantTitle?: string;
  sku?: string;
}): Promise<void> {
  try {
    if (params.currentStock > LOW_STOCK_THRESHOLD) return;
    const baseUrl = siteConfig.urls?.base ?? "";
    const dashboardUrl = baseUrl ? `${baseUrl}${PATH.STUDIO.INVENTORY.ROOT}` : "#";
    const adminUsers = await db.query.user.findMany({
      where: or(eq(userTable.role, "admin"), eq(userTable.role, "staff")),
      columns: { email: true },
    });
    const adminEmails = adminUsers.map((u) => u.email).filter(Boolean) as string[];
    for (const toEmail of adminEmails) {
      await sendLowStockAlertEmail({
        productName: params.productName,
        variantTitle: params.variantTitle,
        sku: params.sku,
        currentStock: params.currentStock,
        threshold: LOW_STOCK_THRESHOLD,
        dashboardUrl,
        toEmail,
      });
    }
  } catch (err) {
    debugError("NOTIFICATION:LOW_STOCK:ERROR", err);
  }
}
