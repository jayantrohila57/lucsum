"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/core/api/api.client";
import { useSession } from "@/core/auth/auth.client";
import {
  getBackdropColorForRazorpayCheckout,
  getPrimaryColorForRazorpayCheckout,
} from "@/core/payment/razorpay.checkout-theme";
import Section from "@/shared/components/layout/section/section";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { clientEnv } from "@/shared/config/env.client";
import { PATH } from "@/shared/config/routes";
import { siteConfig } from "@/shared/config/site";

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name?: string;
      description?: string;
      image?: string;
      callback_url?: string;
      redirect?: boolean;
      prefill?: { name?: string; email?: string; contact?: string };
      notes?: Record<string, string>;
      theme?: { color?: string; backdrop_color?: string };
    }) => { open: () => void };
  }
}

function formatMinorAmount(amount: number, currency: string) {
  const major = amount / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(major);
  } catch {
    return `${major} ${currency}`;
  }
}

interface CheckoutPayClientProps {
  orderId: string;
  reason?: string | null;
}

export function CheckoutPayClient({ orderId, reason }: CheckoutPayClientProps) {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [checkoutReady, setCheckoutReady] = useState(false);

  const statusQuery = apiClient.payment.getStatus.useQuery({ params: { orderId } }, { enabled: Boolean(orderId) });

  const pendingRazorpay = useMemo(() => {
    const rows = statusQuery.data?.data ?? [];
    return rows.find((p) => p.provider === "razorpay" && p.status === "pending");
  }, [statusQuery.data?.data]);

  const rzOrderId =
    pendingRazorpay?.providerMetadata && typeof pendingRazorpay.providerMetadata === "object"
      ? (pendingRazorpay.providerMetadata as { razorpayOrderId?: string }).razorpayOrderId
      : undefined;

  const callbackUrl = useMemo(() => {
    const base = clientEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
    return `${base}/api/payments/razorpay/callback?orderId=${encodeURIComponent(orderId)}`;
  }, [orderId]);

  const logoUrl = useMemo(() => {
    const base = clientEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
    return `${base}/mask-icon.svg`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setCheckoutReady(true);
      return;
    }
    const interval = window.setInterval(() => {
      if (window.Razorpay) {
        setCheckoutReady(true);
        window.clearInterval(interval);
      }
    }, 100);
    const maxWait = window.setTimeout(() => window.clearInterval(interval), 30_000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(maxWait);
    };
  }, []);

  useEffect(() => {
    if (reason === "cancelled") {
      toast.message("Payment was cancelled. You can try again when ready.");
    } else if (reason === "failed" || reason === "invalid") {
      toast.error("Payment could not be completed. Please try again.");
    }
  }, [reason]);

  const openCheckout = useCallback(() => {
    const keyId = clientEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      toast.error("Payment is not configured");
      return;
    }
    if (!pendingRazorpay || !rzOrderId) {
      toast.error("Payment session is not available. Return to checkout to start again.");
      return;
    }
    if (typeof window === "undefined" || !window.Razorpay) {
      toast.error("Payment script is still loading. Try again in a moment.");
      return;
    }

    const isDark = resolvedTheme === "dark";
    const themeColor = getPrimaryColorForRazorpayCheckout();
    const backdropColor = getBackdropColorForRazorpayCheckout(isDark);

    const user = session?.user;
    const rzp = new window.Razorpay({
      key: keyId,
      amount: pendingRazorpay.amount,
      currency: pendingRazorpay.currency ?? "INR",
      order_id: rzOrderId,
      name: siteConfig.name,
      description: `Order ${orderId.slice(0, 8)}…`,
      image: logoUrl,
      callback_url: callbackUrl,
      redirect: true,
      prefill: {
        name: user?.name ?? undefined,
        email: user?.email ?? undefined,
      },
      notes: {
        orderId,
        paymentId: pendingRazorpay.id,
      },
      theme: {
        color: themeColor,
        backdrop_color: backdropColor,
      },
    });
    rzp.open();
  }, [callbackUrl, logoUrl, pendingRazorpay, resolvedTheme, rzOrderId, orderId, session?.user]);

  const isLoading = statusQuery.isLoading;
  const isConfigured = Boolean(clientEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID);

  return (
    <Section title="Secure payment" description="You’ll pay on Razorpay, then return here automatically when done.">
      <Card className="mx-auto max-w-lg border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="font-medium tracking-tight">Pay {siteConfig.name}</CardTitle>
          <CardDescription>
            Checkout uses your site colors on Razorpay. When you finish, Razorpay redirects back to your order
            confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-muted-foreground text-sm">Loading payment…</p>}

          {!isLoading && !pendingRazorpay && (
            <p className="text-muted-foreground text-sm">
              No pending payment was found for this order. Start again from checkout.
            </p>
          )}

          {!isLoading && pendingRazorpay && rzOrderId && (
            <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
              <p className="text-foreground font-medium">
                {formatMinorAmount(pendingRazorpay.amount, pendingRazorpay.currency ?? "INR")}
              </p>
              <p className="text-muted-foreground mt-1">Order reference #{orderId.slice(0, 8)}…</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={PATH.CHECKOUT.ROOT}>Back to checkout</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isConfigured || !pendingRazorpay || !rzOrderId || !checkoutReady}
            onClick={() => openCheckout()}
          >
            {!checkoutReady ? "Loading checkout…" : isConfigured ? "Continue to Razorpay" : "Payment not configured"}
          </Button>
        </CardFooter>
      </Card>
    </Section>
  );
}
