import "server-only";

import { eq } from "drizzle-orm";
import { APP_ROLE, normalizeRole } from "@/core/auth/auth.roles";
import { db } from "@/core/db/db";
import { order } from "@/core/db/db.schema";
import type { Order } from "@/module/order/order.schema";
import { verifyOrderAccessToken } from "@/module/order/order-access-token";
import { guestEmailFromOrderNotes, normalizeGuestEmail } from "@/module/order/order-notes";

type ViewerContext = {
  userId?: string | null;
  role?: string | null;
};

export async function loadOrderForViewer(
  id: string,
  opts: { token?: string | null; email?: string | null; viewer?: ViewerContext },
): Promise<Order | null> {
  const data = await db.query.order.findFirst({
    where: eq(order.id, id),
    with: {
      items: true,
      user: true,
    },
  });

  if (!data) return null;

  const viewer = opts.viewer;
  if (viewer?.userId) {
    const role = normalizeRole(viewer.role);
    const isPrivileged = role === APP_ROLE.ADMIN || role === APP_ROLE.STAFF;
    if (isPrivileged || (data.userId && data.userId === viewer.userId)) {
      return data;
    }
  }

  if (opts.token && verifyOrderAccessToken(opts.token, id)) {
    return data;
  }

  const email = opts.email?.trim();
  if (email) {
    const normalized = normalizeGuestEmail(email);
    const stored = guestEmailFromOrderNotes(data.notes);
    if (stored && stored === normalized) {
      return data;
    }
    if (data.user?.email && normalizeGuestEmail(data.user.email) === normalized) {
      return data;
    }
  }

  return null;
}
