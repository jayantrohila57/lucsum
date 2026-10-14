import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/core/auth/auth.server";
import { GuestOrderAccessForm } from "@/module/order/guest-order-access-form";
import { OrderDetailSection } from "@/module/order/order-detail.section";
import { loadOrderForViewer } from "@/module/order/order-view.server";
import { ShipmentTrackingSection } from "@/module/shipment/components/shipment-tracking-section";
import Section from "@/shared/components/layout/section/section";
import { PATH } from "@/shared/config/routes";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; email?: string }>;
}

export const metadata = {
  title: "Order details",
  description: "View details and tracking for your order",
};

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const { id } = await params;
  const { token, email } = await searchParams;

  if (!id) {
    return redirect(PATH.SHOP.ROOT);
  }

  const { user, session } = await getServerSession();
  const order = await loadOrderForViewer(id, {
    token,
    email,
    viewer: user ? { userId: user.id, role: user.role } : undefined,
  });

  if (!order) {
    if (session) {
      notFound();
    }
    return (
      <Section {...metadata}>
        <GuestOrderAccessForm orderId={id} />
      </Section>
    );
  }

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
