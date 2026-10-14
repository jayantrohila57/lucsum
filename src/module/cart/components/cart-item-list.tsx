"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import type { CartItem as CartItemType } from "@/module/cart/cart.schema";
import { useCart } from "@/module/cart/use-cart";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { PATH } from "@/shared/config/routes";
import { CartItem } from "./cart-item";

export function CartItemList() {
  const { cart, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 py-4 border-b border-border">
            <Skeleton className="h-20 w-20 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <div className="flex justify-between mt-auto">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted p-4 rounded-full mb-4">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6 max-w-xs">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Link href={PATH.SHOP.ROOT}>
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {cart.items.map((item: CartItemType) => (
        <CartItem key={item.lineId} item={item} />
      ))}
    </div>
  );
}
