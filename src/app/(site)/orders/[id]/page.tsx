import type { Route } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { apiServer } from "@/core/api/api.server";
import { getServerSession } from "@/core/auth/auth.server";
import { OrderDetailSection } from "@/module/order/order-detail.section";
import { ShipmentTrackingSection } from "@/module/shipment/components/shipment-tracking-section";
import Section from "@/shared/components/layout/section/section";
import { PATH } from "@/shared/config/routes";
import { safeAuthCallbackPath, signInUrlWithCallback } from "@/shared/utils/auth-callback";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Order details",
  description: "View details and tracking for your order",
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  if (!id) {
    return redirect(PATH.SHOP.ROOT);
  }

  const { session } = await getServerSession();
  if (!session) {
    const h = await headers();
    const intended = safeAuthCallbackPath(h.get("x-intended-path") ?? undefined) ?? (PATH.ORDERS.DETAIL(id) as Route);
    redirect(signInUrlWithCallback(intended) as Route);
  }

  const res = await apiServer.order.get({
    params: { id },
  });

  if (res.status !== "success" || !res.data) {
    return notFound();
  }

  const order = res.data;

  return (
    <Section {...metadata}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">Review items and shipment status for this order.</p>
        </div>

        <OrderDetailSection order={order} />
        <ShipmentTrackingSection orderId={order.id} />
      </div>
    </Section>
  );
}
