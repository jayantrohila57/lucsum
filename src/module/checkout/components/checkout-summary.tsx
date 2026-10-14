"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { apiClient } from "@/core/api/api.client";
import Form from "@/shared/components/form/form";
import { FormSection } from "@/shared/components/form/form.helper";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";

interface CheckoutSummaryProps {
  cartId: string | undefined;
  subtotal: number;
  itemCount: number;
  currency?: string;
}

function formatMoney(amount: number, currency: string) {
  if (currency === "INR") {
    return `₹${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`;
}

export function CheckoutSummary({ cartId, subtotal, itemCount, currency = "INR" }: CheckoutSummaryProps) {
  const form = useFormContext();
  const discountCode = useWatch({
    control: form.control,
    name: "body.discountCode",
  }) as string | undefined;

  const shippingAddressId = useWatch({
    control: form.control,
    name: "body.shippingAddressId",
  }) as string | undefined;

  const guestShipping = useWatch({
    control: form.control,
    name: "body.guestShipping",
  }) as
    | {
        fullName?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        phone?: string;
      }
    | undefined;

  const shippingMethodId = useWatch({
    control: form.control,
    name: "body.shippingMethodId",
  }) as string | undefined;

  const shippingProviderId = useWatch({
    control: form.control,
    name: "body.shippingProviderId",
  }) as string | undefined;

  const hasSavedAddress = typeof shippingAddressId === "string" && shippingAddressId.length > 0;
  const hasGuestAddress = Boolean(
    guestShipping?.fullName?.trim() &&
      guestShipping?.line1?.trim() &&
      guestShipping?.city?.trim() &&
      guestShipping?.state?.trim() &&
      guestShipping?.postalCode?.trim() &&
      guestShipping?.country?.trim(),
  );
  const hasAddress = hasSavedAddress || hasGuestAddress;
  const hasMethod =
    typeof shippingMethodId === "string" &&
    shippingMethodId.length > 0 &&
    typeof shippingProviderId === "string" &&
    shippingProviderId.length > 0;

  const previewEnabled = Boolean(cartId && hasAddress && hasMethod);

  const { data: previewRes, isLoading } = apiClient.order.previewCheckoutTotals.useQuery(
    {
      body: {
        cartId,
        shippingAddressId: hasSavedAddress ? shippingAddressId : undefined,
        shippingAddress:
          hasGuestAddress && !hasSavedAddress
            ? {
                fullName: guestShipping!.fullName!,
                line1: guestShipping!.line1!,
                line2: guestShipping?.line2,
                city: guestShipping!.city!,
                state: guestShipping!.state!,
                postalCode: guestShipping!.postalCode!,
                country: guestShipping!.country!,
                phone: guestShipping?.phone,
              }
            : undefined,
        shippingProviderId: shippingProviderId ?? "",
        shippingMethodId: shippingMethodId ?? "",
        discountCode: discountCode?.trim() || undefined,
      },
    },
    {
      enabled: previewEnabled,
    },
  );

  const totals = previewRes?.status === "success" && previewRes.data ? previewRes.data : null;
  const previewError = previewRes?.status === "failed" ? previewRes.message : null;

  const displayDiscount = totals?.discountTotal ?? 0;
  const displayShipping = totals?.shippingTotal ?? null;
  const displayTax = totals?.taxTotal ?? null;
  const displayTotal = totals?.grandTotal ?? null;

  return (
    <Card className="border-border bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Order summary</CardTitle>
        <p className="text-xs text-muted-foreground">{itemCount} item(s)</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatMoney(subtotal, currency)}</span>
        </div>
        {discountCode && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount ({discountCode})</span>
            <span className="text-green-600">
              {previewEnabled && totals ? (
                <>-{formatMoney(displayDiscount, currency)}</>
              ) : (
                <span className="text-muted-foreground">…</span>
              )}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">
            {!previewEnabled ? (
              <span className="text-muted-foreground text-xs font-normal">Select address &amp; delivery</span>
            ) : isLoading ? (
              <span className="text-muted-foreground text-xs font-normal">Calculating…</span>
            ) : displayShipping != null ? (
              <span className="text-foreground">{formatMoney(displayShipping, currency)}</span>
            ) : (
              <span className="text-destructive text-xs">—</span>
            )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>
            {!previewEnabled ? (
              <span className="text-muted-foreground text-xs">—</span>
            ) : isLoading ? (
              <span className="text-muted-foreground text-xs">…</span>
            ) : displayTax != null ? (
              formatMoney(displayTax, currency)
            ) : (
              "—"
            )}
          </span>
        </div>
        {previewError && (
          <p className="text-xs text-destructive" role="alert">
            {previewError}
          </p>
        )}
        <Separator className="my-2" />
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>
            {!previewEnabled ? (
              <span className="text-muted-foreground text-sm font-normal">Complete shipping to see total</span>
            ) : isLoading ? (
              <span className="text-muted-foreground text-sm font-normal">…</span>
            ) : displayTotal != null ? (
              formatMoney(displayTotal, currency)
            ) : (
              <span className="text-destructive text-sm">—</span>
            )}
          </span>
        </div>
        {previewEnabled && totals && (
          <p className="text-[10px] text-muted-foreground leading-tight">
            Total matches what you will pay at checkout (includes tax and delivery).
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function CheckoutSummaryFormFields() {
  return (
    <div className="space-y-4">
      <DeliveryMethodSection />
      <FormSection title="Discount code" description="Have a coupon or promo code? Apply it here.">
        <Form.Field name="body.discountCode" label="Discount code" type="text" placeholder="Enter code" />
      </FormSection>
      <FormSection title="Order notes" description="Optional instructions for your order.">
        <Form.Field
          name="body.notes"
          label="Notes"
          type="textarea"
          placeholder="Delivery instructions, gift message, etc."
        />
      </FormSection>
      <FormSection title="Terms" description="You must agree to place an order." required>
        <Form.Field
          name="body.agreeToTerms"
          label="I agree to the terms and conditions and refund policy"
          type="switch"
          required
        />
      </FormSection>
    </div>
  );
}

function DeliveryMethodSection() {
  const form = useFormContext();
  const shippingAddressId = useWatch({
    control: form.control,
    name: "body.shippingAddressId",
  }) as string | undefined;

  const guestShipping = useWatch({
    control: form.control,
    name: "body.guestShipping",
  }) as
    | {
        fullName?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        phone?: string;
      }
    | undefined;

  const hasSavedAddress = typeof shippingAddressId === "string" && shippingAddressId.length > 0;
  const hasGuestAddress = Boolean(
    guestShipping?.fullName?.trim() &&
      guestShipping?.line1?.trim() &&
      guestShipping?.city?.trim() &&
      guestShipping?.state?.trim() &&
      guestShipping?.postalCode?.trim() &&
      guestShipping?.country?.trim(),
  );
  const hasAddress = hasSavedAddress || hasGuestAddress;

  const { data, isLoading } = apiClient.shippingConfig.getOptions.useQuery(
    {
      body: hasSavedAddress
        ? { shippingAddressId }
        : hasGuestAddress
          ? {
              shippingAddress: {
                fullName: guestShipping!.fullName!,
                line1: guestShipping!.line1!,
                line2: guestShipping?.line2,
                city: guestShipping!.city!,
                state: guestShipping!.state!,
                postalCode: guestShipping!.postalCode!,
                country: guestShipping!.country!,
                phone: guestShipping?.phone,
              },
            }
          : { shippingAddressId: "" },
    },
    {
      enabled: hasAddress,
    },
  );

  const options = data?.data ?? [];

  const selectedMethodId = useWatch({
    control: form.control,
    name: "body.shippingMethodId",
  }) as string | undefined;

  useEffect(() => {
    if (!options.length) return;
    const currentMethodId = selectedMethodId ?? (form.getValues("body.shippingMethodId") as string | undefined);
    if (!currentMethodId) {
      const first = options[0];
      form.setValue("body.shippingMethodId", first.methodId, { shouldValidate: true });
      form.setValue("body.shippingProviderId", first.providerId, { shouldValidate: true });
    }
  }, [options, form, selectedMethodId]);

  useEffect(() => {
    if (!selectedMethodId) return;
    const match = options.find((opt) => opt.methodId === selectedMethodId);
    if (!match) return;
    form.setValue("body.shippingProviderId", match.providerId, { shouldValidate: true });
  }, [selectedMethodId, options, form]);

  return (
    <FormSection
      title="Delivery method"
      description={
        !hasAddress
          ? "Add a shipping address to see available delivery methods."
          : "Choose how you want your order delivered."
      }
      required
    >
      {!hasAddress && <p className="text-xs text-muted-foreground">No shipping address selected yet.</p>}
      {hasAddress && isLoading && <p className="text-xs text-muted-foreground">Loading available delivery methods…</p>}
      {hasAddress && !isLoading && options.length === 0 && (
        <p className="text-xs text-destructive">
          No delivery options are configured for this address. Please use a different address.
        </p>
      )}
      {hasAddress && options.length > 0 && (
        <Form.Field
          name="body.shippingMethodId"
          label="Choose a delivery option"
          type="radio"
          required
          options={options.map((opt) => ({
            value: opt.methodId,
            label: `${opt.providerName} – ${opt.methodName} · ₹${opt.price.toLocaleString()}${
              opt.etaDays ? ` · ${opt.etaDays}-day delivery` : ""
            }`,
          }))}
        />
      )}
    </FormSection>
  );
}
