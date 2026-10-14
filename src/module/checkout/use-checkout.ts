"use client";

import { toast } from "sonner";
import { apiClient } from "@/core/api/api.client";
import { useSession } from "@/core/auth/auth.client";
import type { Address } from "@/module/address/address.schema";
import { useAddress } from "@/module/address/use-address";
import { useCart } from "@/module/cart/use-cart";
import { handleTrpcAuthClientError } from "@/shared/utils/handle-trpc-auth-error";
import type { CheckoutFormBody, CheckoutInitResult } from "./checkout.schema";

function addressToSnapshot(addr: Pick<Address, "line1" | "line2" | "city" | "state" | "postalCode" | "country">) {
  return {
    fullName: "Customer",
    line1: addr.line1,
    line2: addr.line2 ?? "",
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
    phone: "",
  };
}

export function useCheckout() {
  const { data: session } = useSession();
  const isSignedIn = Boolean(session?.user?.id);
  const { cart, isLoading: cartLoading } = useCart();
  const { addresses, isLoading: addressLoading } = useAddress();

  const createOrder = apiClient.order.create.useMutation();
  const createIntent = apiClient.payment.createIntent.useMutation();

  const shippingAddresses = addresses.filter((a) => a.type === "shipping");
  const billingAddresses = addresses.filter((a) => a.type === "billing");

  /**
   * Create order from cart and create Razorpay payment intent.
   * Returns { order, payment, razorpayOrderId } for the payment page redirect flow.
   */
  async function initiateCheckout(body: CheckoutFormBody): Promise<CheckoutInitResult | null> {
    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return null;
    }

    let shippingSnapshot = body.guestShipping;
    let billingSnapshot = body.guestShipping;

    if (isSignedIn) {
      const shippingAddr = shippingAddresses.find((a) => a.id === body.shippingAddressId);
      if (!shippingAddr) {
        toast.error("Please select a valid shipping address");
        return null;
      }
      shippingSnapshot = addressToSnapshot(shippingAddr);
      const billingAddr = body.sameAsShipping
        ? shippingAddr
        : body.billingAddressId
          ? (billingAddresses.find((a) => a.id === body.billingAddressId) ?? shippingAddr)
          : shippingAddr;
      billingSnapshot = addressToSnapshot(billingAddr);
    } else if (!shippingSnapshot) {
      toast.error("Please enter your shipping address");
      return null;
    }

    try {
      const orderRes = await createOrder.mutateAsync({
        body: {
          cartId: cart.id,
          shippingAddress: shippingSnapshot,
          billingAddress: billingSnapshot ?? shippingSnapshot,
          notes: body.notes ?? undefined,
          guestEmail: !isSignedIn ? body.guestEmail : undefined,
          shippingProviderId: body.shippingProviderId,
          shippingMethodId: body.shippingMethodId,
          discountCode: body.discountCode || undefined,
        },
      });

      if (orderRes.status !== "success" || !orderRes.data) {
        toast.error(orderRes.message ?? "Failed to create order");
        return null;
      }

      const orderId = orderRes.data.id;
      const intentRes = await createIntent.mutateAsync({
        body: { orderId, provider: "razorpay" },
      });

      if (intentRes.status !== "success" || !intentRes.data) {
        toast.error(intentRes.message ?? "Failed to create payment");
        return null;
      }

      const { payment, razorpayOrderId } = intentRes.data;
      if (!razorpayOrderId) {
        toast.error("Payment setup failed");
        return null;
      }

      return {
        order: orderRes.data,
        payment,
        razorpayOrderId,
      };
    } catch (err) {
      if (handleTrpcAuthClientError(err, "Please sign in again to complete checkout.")) return null;
      toast.error("Something went wrong. Please try again.");
      console.error(err);
      return null;
    }
  }

  return {
    cart,
    addresses: { shipping: shippingAddresses, billing: billingAddresses, all: addresses },
    isSignedIn,
    isLoading: cartLoading || (isSignedIn && addressLoading),
    isPlacingOrder: createOrder.isPending || createIntent.isPending,
    initiateCheckout,
  };
}
