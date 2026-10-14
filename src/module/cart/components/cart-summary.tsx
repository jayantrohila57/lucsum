"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/module/cart/use-cart";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { PATH } from "@/shared/config/routes";

export function CartSummary() {
  const { cart, isLoading, clearCart, isClearing } = useCart();

  if (isLoading || !cart || cart.items.length === 0) return null;

  const subtotal = cart.subtotal;
  const shipping = 0; // In a real app, this would be dynamic
  const tax = Math.round(subtotal * 0.18); // Example 18% GST
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-muted/30 rounded-lg p-6 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (!isClearing) clearCart();
              }}
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Clearing…
                </>
              ) : (
                "Clear cart"
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove all items from your cart</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated Tax (18%)</span>
          <span>₹{tax.toLocaleString()}</span>
        </div>

        <Separator className="my-2" />

        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>₹{total.toLocaleString()}</span>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="w-full mt-2" size="lg" asChild>
            <Link href={PATH.CHECKOUT.ROOT}>Proceed to Checkout</Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Continue to payment and address details</p>
        </TooltipContent>
      </Tooltip>

      <p className="text-[10px] text-muted-foreground text-center">Shipping and taxes are calculated at checkout.</p>
    </div>
  );
}
