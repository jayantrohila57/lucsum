import { NextResponse } from "next/server";
import { completeRazorpayPaymentAfterVerification } from "@/core/payment/razorpay.complete";
import { createOrderAccessToken } from "@/module/order/order-access-token";
import { PATH } from "@/shared/config/routes";
import { getPublicBaseUrl } from "@/shared/utils/lib/public-base-url";

function payPageUrl(base: string, orderId: string, extra?: string) {
  const q = new URLSearchParams({ orderId });
  if (extra) q.set("reason", extra);
  return `${base}${PATH.CHECKOUT.PAY}?${q.toString()}`;
}

export async function POST(request: Request) {
  const base = getPublicBaseUrl();
  const url = new URL(request.url);
  const orderIdParam = url.searchParams.get("orderId") ?? undefined;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(
      orderIdParam ? payPageUrl(base, orderIdParam, "invalid") : `${base}${PATH.CHECKOUT.ROOT}?payment=error`,
      303,
    );
  }

  const razorpay_payment_id = formData.get("razorpay_payment_id")?.toString()?.trim();
  const razorpay_order_id = formData.get("razorpay_order_id")?.toString()?.trim();
  const razorpay_signature = formData.get("razorpay_signature")?.toString()?.trim();

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return NextResponse.redirect(
      orderIdParam ? payPageUrl(base, orderIdParam, "cancelled") : `${base}${PATH.CHECKOUT.ROOT}?payment=cancelled`,
      303,
    );
  }

  const result = await completeRazorpayPaymentAfterVerification({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    expectedOrderId: orderIdParam,
  });

  if (!result.ok) {
    return NextResponse.redirect(
      orderIdParam ? payPageUrl(base, orderIdParam, "failed") : `${base}${PATH.CHECKOUT.ROOT}?payment=failed`,
      303,
    );
  }

  const confirm = new URL(`${base}${PATH.CHECKOUT.CONFIRMATION}`);
  confirm.searchParams.set("orderId", result.orderId);
  const accessToken = createOrderAccessToken(result.orderId);
  if (accessToken) confirm.searchParams.set("token", accessToken);
  return NextResponse.redirect(confirm.toString(), 303);
}
