"use client";

import type { Route } from "next";
import Link from "next/link";
import { BlurImage } from "@/shared/components/common/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getImageSrc } from "@/shared/utils/lib/image.utils";

const formatPrice = (priceInPaise: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInPaise / 100);
};

type FlattenedVariant = {
  id: string;
  slug: string;
  title: string;
  priceModifierType: string;
  priceModifierValue: string;
  attributes: { title: string; type: string; value: string }[] | null;
  media: { url: string }[] | null;
  productId: string;
  productTitle: string;
  productSlug: string;
  productDescription: string | null;
  productBasePrice: number;
  productBaseImage: string | null;
  finalPrice: number;
};

interface ProductSubcategoryCardsProps {
  data: FlattenedVariant[];
  categorySlug: string;
  subcategorySlug: string;
}

export function ProductSubcategoryCards({ data, categorySlug, subcategorySlug }: ProductSubcategoryCardsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <p className="text-muted-foreground text-sm">No products in this category right now.</p>
        <p className="text-muted-foreground max-w-md text-xs">
          Check back soon — we&apos;re often restocking. Browse other categories or contact us if you&apos;re looking
          for something specific.
        </p>
        <Link
          href={`/store/${categorySlug}` as Route}
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Back to category
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((variant) => {
        // 3-segment URL: /store/category/subcategory/variantSlug
        const href = `/store/${categorySlug}/${subcategorySlug}/${variant.slug}` as Route;

        // Get display image - variant media first, then product base image
        const displayImage = variant.productBaseImage || variant.media?.[0]?.url;

        // Display title: combine product title with variant title for clarity
        const displayTitle =
          variant.title !== variant.productTitle ? `${variant.productTitle} - ${variant.title}` : variant.productTitle;

        return (
          <Link key={variant.id} href={href} className="group">
            <Card className="pt-0 transition-shadow hover:shadow-md">
              <CardHeader className="p-0">
                <BlurImage
                  src={getImageSrc(displayImage)}
                  alt={displayTitle}
                  width={500}
                  height={500}
                  className="bg-secondary motion-all aspect-square w-full rounded-md rounded-b-none object-cover group-hover:drop-shadow"
                />
              </CardHeader>

              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg font-semibold line-clamp-1">{displayTitle}</CardTitle>
                  <p className="text-lg font-medium text-primary">{formatPrice(variant.finalPrice)}</p>
                </div>

                {variant.attributes && variant.attributes.length > 0 && (
                  <div className="mt-auto flex flex-col gap-1">
                    {variant.attributes.slice(0, 3).map((attr) => (
                      <p key={attr.title} className="flex justify-between text-xs text-muted-foreground">
                        <span>{attr.title}</span>
                        <span>{attr.value}</span>
                      </p>
                    ))}
                    {variant.attributes.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{variant.attributes.length - 3} more options</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
