import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/core/auth/auth.server";
import { OrderDetailSection } from "@/module/order/order-detail.section";
import { loadOrderForViewer } from "@/module/order/order-view.server";
import Section from "@/shared/components/layout/section/section";
import { Button } from "@/shared/components/ui/button";
import { PATH } from "@/shared/config/routes";

interface ConfirmationPageProps {
  searchParams: Promise<{ orderId?: string; token?: string; email?: string }>;
}

export const metadata = {
  title: "Order confirmation",
  description: "Thank you for your order",
};

export default async function CheckoutConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    return redirect(PATH.SHOP.ROOT);
  }

  const { user } = await getServerSession();
  const order = await loadOrderForViewer(orderId, {
    token: params.token,
    email: params.email,
    viewer: user ? { userId: user.id, role: user.role } : undefined,
  });

  if (!order) {
    redirect(PATH.SHOP.ROOT);
  }

  const orderDetailParams = new URLSearchParams();
  if (params.token) orderDetailParams.set("token", params.token);

  const orderDetailHref =
    orderDetailParams.size > 0
      ? (`${PATH.ORDERS.DETAIL(order.id)}?${orderDetailParams.toString()}` as Route)
      : (PATH.ORDERS.DETAIL(order.id) as Route);

  return (
    <Section title={metadata.title} description={metadata.description}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Thank you for your order!</h1>
          <p className="text-sm text-muted-foreground">
            Your order <span className="font-semibold text-foreground">#{order.id.slice(0, 8)}</span> has been received.
            A confirmation email has been sent to you.
          </p>
        </div>

        <OrderDetailSection
          order={order}
          showTimeline={false}
          actions={
            <>
              <Button asChild size="sm" className="min-h-11">
                <Link href={orderDetailHref}>View order details</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="min-h-11">
                <Link href={PATH.SHOP.ROOT}>Continue shopping</Link>
              </Button>
            </>
          }
        />
      </div>
    </Section>
  );
}
