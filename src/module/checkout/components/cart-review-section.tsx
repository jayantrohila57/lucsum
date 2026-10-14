"use client";

import type { Route } from "next";
import Link from "next/link";
import type { CartItem } from "@/module/cart/cart.schema";
import { BlurImage } from "@/shared/components/common/image";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { PATH } from "@/shared/config/routes";
import { storefrontFeatures } from "@/shared/config/storefront";
import { getImageSrc } from "@/shared/utils/lib/image.utils";

interface CartReviewSectionProps {
  items: CartItem[];
  isLoading?: boolean;
}

function CartReviewItem({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center gap-4 border-b border-border py-4 last:border-0 last:pb-0 first:pt-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border">
        <BlurImage src={getImageSrc(item.image)} alt={item.productTitle ?? "Product"} fill className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-foreground">{item.productTitle}</h3>
        <p className="text-xs text-muted-foreground">{item.variantTitle}</p>
        {item.attributes && item.attributes.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.attributes.map((attr) => (
              <span
                key={attr.title}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground"
              >
                {attr.title}: {attr.value}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <span className="text-xs text-muted-foreground">Qty {item.quantity}</span>
        <p className="text-sm font-semibold">₹{item.totalPrice.toLocaleString()}</p>
      </div>
    </div>
  );
}

export function CartReviewSection({ items, isLoading }: CartReviewSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Cart review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 py-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Cart review</CardTitle>
          <p className="text-muted-foreground text-xs">Your cart is empty. Add something before checkout.</p>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href={(storefrontFeatures.minimalPublicSite ? PATH.SHOP.ROOT : PATH.STORE.ROOT) as Route}>
              Continue shopping
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Cart review</CardTitle>
        <p className="text-xs text-muted-foreground">{items.length} item(s) in your cart</p>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {items.map((item) => (
            <CartReviewItem key={item.lineId} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
