"use client";

import Link from "next/link";
import { useCart } from "@/module/cart/use-cart";
import { Button } from "@/shared/components/ui/button";
import { PATH } from "@/shared/config/routes";
import { cn } from "@/shared/utils/lib/utils";

interface ViewCartButtonProps {
  variantId: string;
  className?: string;
}

export function ViewCartButton({ variantId, className }: ViewCartButtonProps) {
  const { cart, isLoading } = useCart();

  if (isLoading || !cart || !cart.items || cart.items.length === 0) return null;

  const hasVariantInCart = cart.items.some((item) => item.variantId === variantId);

  if (!hasVariantInCart) return null;

  return (
    <Link href={PATH.CART}>
      <Button variant="outline" className={cn("w-full", className)}>
        View cart
      </Button>
    </Link>
  );
}
