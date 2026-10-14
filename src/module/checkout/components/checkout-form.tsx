"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { z } from "zod/v3";
import { useSession } from "@/core/auth/auth.client";
import { checkoutFormSchema } from "@/module/checkout/checkout.schema";
import { useCheckout } from "@/module/checkout/use-checkout";
import Form from "@/shared/components/form/form";
import { FormSection } from "@/shared/components/form/form.helper";
import { Separator } from "@/shared/components/ui/separator";
import { clientEnv } from "@/shared/config/env.client";
import { PATH } from "@/shared/config/routes";
import { AddressSelectionSection } from "./address-selection-section";
import { CartReviewSection } from "./cart-review-section";
import { CheckoutSummary, CheckoutSummaryFormFields } from "./checkout-summary";
import { GuestShippingSection } from "./guest-shipping-section";
import { PlaceOrderButton } from "./place-order-button";

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export function CheckoutForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const isSignedIn = Boolean(session?.user?.id);
  const { cart, addresses, isLoading: dataLoading, isPlacingOrder, initiateCheckout } = useCheckout();

  const defaultShippingId = addresses.shipping[0]?.id ?? "";
  const defaultValues: CheckoutFormValues = {
    body: {
      shippingAddressId: defaultShippingId,
      guestShipping: isSignedIn
        ? undefined
        : {
            fullName: "",
            line1: "",
            line2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "IN",
            phone: "",
          },
      shippingProviderId: "",
      shippingMethodId: "",
      sameAsShipping: true,
      notes: "",
      agreeToTerms: false,
    },
  };

  const handlePlaceOrder = async (data: CheckoutFormValues) => {
    const keyId = clientEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      toast.error("Payment is not configured");
      return;
    }

    const result = await initiateCheckout(data.body);
    if (!result) return;

    router.push(`${PATH.STORE.CHECKOUT.PAY}?orderId=${encodeURIComponent(result.order.id)}`);
  };

  const isLoading = dataLoading || isPlacingOrder;

  return (
    <Form<CheckoutFormValues["body"] extends never ? never : typeof checkoutFormSchema>
      key={defaultShippingId || "no-address"}
      schema={checkoutFormSchema}
      defaultValues={defaultValues}
      onSubmitAction={(values) => handlePlaceOrder(values as CheckoutFormValues)}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CartReviewSection items={cart?.items ?? []} isLoading={dataLoading && !cart} />
          <Separator />
          {isSignedIn ? (
            <AddressSelectionSection shippingAddresses={addresses.shipping} billingAddresses={addresses.billing} />
          ) : (
            <GuestShippingSection />
          )}
          <Separator />
          <CheckoutSummaryFormFields />
        </div>

        <div className="space-y-4 lg:col-span-1">
          {cart && (
            <CheckoutSummary cartId={cart.id} subtotal={cart.subtotal} itemCount={cart.itemCount} currency="INR" />
          )}
          <Form.StatusBadge />
          <PlaceOrderButton
            disabled={!cart?.items?.length || (isSignedIn && !addresses.shipping.length)}
            isLoading={isLoading}
            razorpayConfigured={!!clientEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID}
          />
        </div>
      </div>
    </Form>
  );
}
