import type { Metadata } from "next";
import { CheckoutClient } from "@/app/(site)/store/checkout/checkout-client";
import Shell from "@/shared/components/layout/shell";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase securely with Razorpay",
};

export default async function CheckoutPage() {
  return (
    <Shell>
      <Shell.Section>
        <CheckoutClient />
      </Shell.Section>
    </Shell>
  );
}
