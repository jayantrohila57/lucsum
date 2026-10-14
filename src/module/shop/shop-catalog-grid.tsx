"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { RouterOutputs } from "@/core/api/api.client";
import { BlurImage } from "@/shared/components/common/image";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { LUCSUM_STYLE_LABELS, storefrontFeatures } from "@/shared/config/storefront";
import { getImageSrc } from "@/shared/utils/lib/image.utils";

export type ShopCatalogItem = NonNullable<RouterOutputs["product"]["listShopCatalog"]["data"]>[number];

function formatInr(minor: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    minor / 100,
  );
}

export function ShopCatalogGrid({ items }: { items: ShopCatalogItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const style = searchParams.get("style") ?? "";
  const color = searchParams.get("color") ?? "";
  const size = searchParams.get("size") ?? "";
  const collection = storefrontFeatures.minimalPublicSite ? "" : (searchParams.get("collection") ?? "");

  const colors = useMemo(() => [...new Set(items.map((i) => i.colorLabel))].sort(), [items]);
  const sizes = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const s of item.allSizes) set.add(s);
    }
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (style && item.styleSlug !== style) return false;
      if (color && item.colorLabel !== color) return false;
      if (collection && !item.collectionSlugs.includes(collection)) return false;
      if (size && !item.allSizes.includes(size)) return false;
      return true;
    });
  }, [items, style, color, size, collection]);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    const q = params.toString();
    router.replace((q ? `${pathname}?${q}` : pathname) as Route, { scroll: false });
  };

  const clearFilters = () => router.replace(pathname as Route, { scroll: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 md:flex-row md:flex-wrap md:items-end">
        <div className="grid min-w-[140px] flex-1 gap-2">
          <Label>Style</Label>
          <Select value={style || "all"} onValueChange={(v) => setParam("style", v)}>
            <SelectTrigger>
              <SelectValue placeholder="All styles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All styles</SelectItem>
              {Object.entries(LUCSUM_STYLE_LABELS).map(([slug, title]) => (
                <SelectItem key={slug} value={slug}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-[140px] flex-1 gap-2">
          <Label>Colour</Label>
          <Select value={color || "all"} onValueChange={(v) => setParam("color", v)}>
            <SelectTrigger>
              <SelectValue placeholder="All colours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All colours</SelectItem>
              {colors.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-[120px] flex-1 gap-2">
          <Label>Size</Label>
          <Select value={size || "all"} onValueChange={(v) => setParam("size", v)}>
            <SelectTrigger>
              <SelectValue placeholder="All sizes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sizes</SelectItem>
              {sizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!storefrontFeatures.minimalPublicSite ? (
          <div className="grid min-w-[160px] flex-1 gap-2">
            <Label>Collection</Label>
            <Select value={collection || "all"} onValueChange={(v) => setParam("collection", v)}>
              <SelectTrigger>
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {(style || color || size || collection) && (
          <Button type="button" variant="ghost" className="w-fit" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        Showing {filtered.length} of {items.length} tees
      </p>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">No tees match these filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <Link key={item.id} href={item.pdpPath as Route} className="group">
              <Card className="gap-0 overflow-hidden border-border py-0">
                <CardHeader className="p-0">
                  <BlurImage
                    src={getImageSrc(item.image)}
                    alt={item.title}
                    width={600}
                    height={600}
                    className="aspect-square w-full bg-muted object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </CardHeader>
                <CardContent className="space-y-2 p-3">
                  <CardTitle className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</CardTitle>
                  <p className="text-sm font-semibold text-primary">{formatInr(item.priceMinor)}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {item.styleTitle}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {item.colorLabel}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
