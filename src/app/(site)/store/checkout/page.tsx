import type { Metadata } from "next";
import Shell from "@/shared/components/layout/shell";
import { CheckoutClient } from "./checkout-client";

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
