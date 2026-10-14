import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { apiServer } from "@/core/api/api.server";
import { getServerSession } from "@/core/auth/auth.server";
import { OrderDetailSection } from "@/module/order/order-detail.section";
import Section from "@/shared/components/layout/section/section";
import { Button } from "@/shared/components/ui/button";
import { PATH } from "@/shared/config/routes";
import { safeAuthCallbackPath, signInUrlWithCallback } from "@/shared/utils/auth-callback";

interface ConfirmationPageProps {
  searchParams: Promise<{ orderId?: string }>;
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

  const { session } = await getServerSession();
  if (!session) {
    const h = await headers();
    const fallback = `${PATH.CHECKOUT.CONFIRMATION}?orderId=${encodeURIComponent(orderId)}`;
    const intended = safeAuthCallbackPath(h.get("x-intended-path") ?? undefined) ?? (fallback as Route);
    redirect(signInUrlWithCallback(intended) as Route);
  }

  const res = await apiServer.order.get({
    params: { id: orderId },
  });

  if (res.status !== "success" || !res.data) {
    redirect(PATH.SHOP.ROOT);
  }

  const order = res.data;

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
              <Button asChild size="sm">
                <Link href={PATH.ORDERS.DETAIL(order.id) as Route}>View order details</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={PATH.SHOP.ROOT}>Continue shopping</Link>
              </Button>
            </>
          }
        />
      </div>
    </Section>
  );
}
