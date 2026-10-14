import { ChevronRight, Package, ShieldCheck } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { PDPImageGallery } from "@/module/product/product-pdp-gallery";
import { PDPWishlistToggle } from "@/module/product/product-pdp-wishlist-toggle";
import { ProductReviews } from "@/module/review/components/product-reviews";
import { CmsHtml } from "@/module/site/cms-html";
import { AddToCartButton } from "@/shared/components/common/add-to-cart-button";
import { BuyNowButton } from "@/shared/components/common/buy-now-button";
import { ViewCartButton } from "@/shared/components/common/view-cart-button";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { PATH } from "@/shared/config/routes";
import { storefrontFeatures } from "@/shared/config/storefront";
import { computeVariantUnitPrice } from "@/shared/seo/pricing";
import { compareSizeAttributeValues, formatBreadcrumbLabel } from "@/shared/utils/lib/breadcrumb-label";
import { getImageSrc } from "@/shared/utils/lib/image.utils";
import type { PDPVariantFullPathPayload } from "./product.types";
import { extractAttributeGroups, isOptionAvailable, resolveNextVariant } from "./product-utility";

function formatMinorAsCurrency(minorUnits: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minorUnits / 100);
  } catch {
    return `${minorUnits / 100} ${currency}`;
  }
}

function collectGalleryImages(
  variantMedia: { url: string }[] | null | undefined,
  productBaseImage: string | null | undefined,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null | undefined) => {
    const src = raw ? getImageSrc(raw) : null;
    if (!src || seen.has(src)) return;
    seen.add(src);
    out.push(src);
  };
  for (const m of variantMedia ?? []) {
    push(m?.url);
  }
  push(productBaseImage);
  return out;
}

function stockLabel(
  tracksInventory: boolean | null | undefined,
  inv: { availableQuantity: number } | null | undefined,
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } | null {
  if (!tracksInventory) return null;
  if (!inv) return { label: "Availability on request", variant: "secondary" };
  const q = inv.availableQuantity;
  if (q <= 0) return { label: "Out of stock", variant: "destructive" };
  if (q <= 5) return { label: `Only ${q} left`, variant: "outline" };
  return { label: "In stock", variant: "default" };
}

interface PDPProductProps {
  data: PDPVariantFullPathPayload;
  slug: string;
  categorySlug?: string;
  subcategorySlug?: string;
}

export const PDPProduct = ({ data, slug, categorySlug, subcategorySlug }: PDPProductProps) => {
  if (!data?.product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Product not found</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            This product is unavailable or the link may be incorrect.
            <div className="mt-6">
              <Button asChild>
                <Link href={PATH.STORE.ROOT}>Back to store</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const product = data.product;
  const variants = product?.variants ?? [];
  const seo = data.seo;

  const selectedVariant =
    variants.find((v) => v.slug?.toLowerCase().trim() === slug?.toLowerCase().trim()) ?? variants[0];

  if (!selectedVariant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Variant not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={PATH.STORE.ROOT}>Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attributeGroups = extractAttributeGroups(variants);
  const currency = product.baseCurrency ?? "INR";
  const finalMinor = computeVariantUnitPrice(product, selectedVariant);
  const rawModifier = selectedVariant?.priceModifierValue;
  const priceModifier = Number(rawModifier) || 0;

  const catSlug = categorySlug ?? product?.categorySlug;
  const subcatSlug = subcategorySlug ?? product?.subcategorySlug;

  const galleryImages = collectGalleryImages(selectedVariant?.media, product?.baseImage);
  const inv = seo?.variantInventory;
  const tracksInventory = product.tracksInventory !== false;
  const stock = stockLabel(tracksInventory, inv);
  const aggregate = seo?.reviewAggregate;

  const categoryLabel = formatBreadcrumbLabel(catSlug);
  const subcategoryLabel = formatBreadcrumbLabel(subcatSlug);
  const outOfStock = tracksInventory && inv != null && inv.availableQuantity <= 0;
  const displayVariantTitle =
    selectedVariant.title && selectedVariant.title.trim() !== product.title?.trim() ? selectedVariant.title : null;

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 min-w-0">
          <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted-foreground">
            <li className="inline-flex min-w-0 items-center gap-1">
              <Link href={PATH.STORE.ROOT} className="shrink-0 hover:text-foreground">
                Store
              </Link>
              <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
            </li>
            <li className="inline-flex min-w-0 items-center gap-1">
              <Link href={PATH.STORE.CATEGORIES.CATEGORY(catSlug) as Route} className="truncate hover:text-foreground">
                {categoryLabel}
              </Link>
              <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
            </li>
            <li className="inline-flex min-w-0 items-center gap-1">
              <Link
                href={PATH.STORE.SUB_CATEGORIES.SUBCATEGORY(subcatSlug, catSlug) as Route}
                className="truncate hover:text-foreground"
              >
                {subcategoryLabel}
              </Link>
              <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
            </li>
            <li className="min-w-0 font-medium text-foreground">
              <span className="line-clamp-2 sm:line-clamp-1">{product.title}</span>
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-start">
          {/* Gallery */}
          <div className="min-w-0 lg:sticky lg:top-28">
            <PDPImageGallery
              images={galleryImages}
              alt={product?.title ?? "Product"}
              overlay={
                storefrontFeatures.showWishlist ? <PDPWishlistToggle variantId={selectedVariant.id} /> : undefined
              }
            />
          </div>

          {/* Buy column */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              {aggregate && aggregate.reviewCount > 0 ? (
                <Badge variant="secondary" className="gap-1 font-normal">
                  <span aria-hidden>★</span>
                  {aggregate.ratingValue.toFixed(1)}
                  <span className="text-muted-foreground">({aggregate.reviewCount} reviews)</span>
                </Badge>
              ) : null}
              {stock ? <Badge variant={stock.variant}>{stock.label}</Badge> : null}
              {product.status === "live" ? (
                <Badge variant="outline" className="gap-1 font-normal">
                  <ShieldCheck className="size-3" aria-hidden />
                  Secure checkout
                </Badge>
              ) : null}
            </div>

            <div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{product.title}</h1>
              {displayVariantTitle ? <p className="text-muted-foreground mt-2 text-lg">{displayVariantTitle}</p> : null}
            </div>

            {product.description ? (
              <CmsHtml html={product.description} className="line-clamp-4 text-base leading-relaxed" />
            ) : null}

            <div className="flex flex-wrap items-baseline gap-3 border-y border-border py-4">
              <span className="text-3xl font-semibold tabular-nums tracking-tight">
                {formatMinorAsCurrency(finalMinor, currency)}
              </span>
              <span className="text-muted-foreground text-sm">Price includes applicable taxes · {currency}</span>
              {rawModifier != null && String(rawModifier).length > 0 && priceModifier !== 0 ? (
                <Badge variant="outline" className="font-normal">
                  {selectedVariant.priceModifierType === "percent_increase"
                    ? `+${priceModifier}%`
                    : selectedVariant.priceModifierType === "percent_decrease"
                      ? `−${priceModifier}%`
                      : selectedVariant.priceModifierType === "flat_increase"
                        ? `+${formatMinorAsCurrency(priceModifier, currency)}`
                        : `−${formatMinorAsCurrency(priceModifier, currency)}`}
                </Badge>
              ) : null}
            </div>

            {Object.keys(attributeGroups).length > 0 ? (
              <div className="space-y-5">
                <p className="text-sm font-medium">Choose options</p>
                {Object.entries(attributeGroups).map(([title, values]) => (
                  <div key={title}>
                    <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">{title}</p>
                    <div className="flex flex-wrap gap-2">
                      {(title.toLowerCase() === "size"
                        ? Array.from(values).sort(compareSizeAttributeValues)
                        : Array.from(values).sort((a, b) => a.localeCompare(b))
                      ).map((value) => {
                        const isSelected = selectedVariant?.attributes?.some(
                          (a) => a.title === title && a.value === value,
                        );
                        const available = isOptionAvailable({
                          variants,
                          current: selectedVariant,
                          changeAttrTitle: title,
                          changeAttrValue: value,
                        });

                        if (!available) {
                          return (
                            <Button
                              key={value}
                              size="sm"
                              variant="outline"
                              disabled
                              className="cursor-not-allowed capitalize opacity-40"
                            >
                              {value}
                            </Button>
                          );
                        }

                        const nextVariant = resolveNextVariant({
                          variants,
                          current: selectedVariant,
                          changeAttrTitle: title,
                          changeAttrValue: value,
                        });

                        return (
                          <Link
                            key={value}
                            href={`/store/${catSlug}/${subcatSlug}/${nextVariant.slug}` as Route}
                            prefetch={false}
                          >
                            <Button size="sm" variant={isSelected ? "default" : "outline"} className="capitalize">
                              {value}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
              <div className="min-w-0 flex-1 sm:max-w-xs">
                <AddToCartButton variantId={selectedVariant.id} disabled={outOfStock} />
              </div>
              <ViewCartButton variantId={selectedVariant.id} className="min-w-0 flex-1 sm:max-w-[180px]" />
              <BuyNowButton variantId={selectedVariant.id} className="sm:shrink-0" />
            </div>

            {(inv?.sku || inv?.barcode) && (
              <dl className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                {inv.sku ? (
                  <div>
                    <dt className="text-muted-foreground">SKU</dt>
                    <dd className="mt-0.5 font-mono text-foreground">{inv.sku}</dd>
                  </div>
                ) : null}
                {inv.barcode ? (
                  <div>
                    <dt className="text-muted-foreground">Barcode</dt>
                    <dd className="mt-0.5 font-mono text-foreground">{inv.barcode}</dd>
                  </div>
                ) : null}
              </dl>
            )}

            <div className="text-muted-foreground flex flex-wrap items-start gap-2 text-xs">
              <Package className="size-4 shrink-0 mt-0.5" aria-hidden />
              <p>
                Free shipping and returns policies may apply at checkout. Need help?{" "}
                <Link href={PATH.SITE.CONTACT as Route} className="text-primary underline-offset-4 hover:underline">
                  Contact support
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Full detail sections */}
        <div className="mt-14 lg:mt-20">
          <Separator className="mb-10" />
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <section aria-labelledby="pdp-description">
                <h2 id="pdp-description" className="text-xl font-semibold tracking-tight">
                  About this product
                </h2>
                {product.description ? (
                  <CmsHtml html={product.description} className="mt-4 max-w-prose text-base leading-relaxed" />
                ) : (
                  <p className="text-muted-foreground mt-4 text-sm">No detailed description has been added yet.</p>
                )}
              </section>

              {product.features && product.features.length > 0 ? (
                <section aria-labelledby="pdp-features">
                  <h2 id="pdp-features" className="text-xl font-semibold tracking-tight">
                    Highlights
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {product.features.map((f, i) => (
                      <li key={i} className="flex gap-3 text-muted-foreground">
                        <span className="text-primary mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="leading-relaxed">{f.title}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className="space-y-4 lg:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">At a glance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-border pb-3">
                    <span className="text-muted-foreground">Category</span>
                    <Link
                      href={PATH.STORE.CATEGORIES.CATEGORY(catSlug) as Route}
                      className="text-right font-medium text-primary hover:underline"
                    >
                      {categoryLabel}
                    </Link>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border pb-3">
                    <span className="text-muted-foreground">Collection</span>
                    <Link
                      href={PATH.STORE.SUB_CATEGORIES.SUBCATEGORY(subcatSlug, catSlug) as Route}
                      className="text-right font-medium text-primary hover:underline"
                    >
                      {subcategoryLabel}
                    </Link>
                  </div>
                  {inv?.sku ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">SKU</span>
                      <span className="font-mono text-right text-xs">{inv.sku}</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <ProductReviews productId={product.id} canWriteReview />
        </div>
      </div>
    </div>
  );
};
