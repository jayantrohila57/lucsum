"use client";

import { SlidersHorizontal } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { RouterOutputs } from "@/core/api/api.client";
import { BlurImage } from "@/shared/components/common/image";
import { BorderedGrid, BorderedGridCell, BoxCard } from "@/shared/components/layout/box";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import { LUCSUM_STYLE_LABELS, storefrontFeatures } from "@/shared/config/storefront";
import { getImageSrc } from "@/shared/utils/lib/image.utils";

export type ShopCatalogItem = NonNullable<RouterOutputs["product"]["listShopCatalog"]["data"]>[number];

function formatInr(minor: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    minor / 100,
  );
}

type FilterParams = {
  style: string;
  color: string;
  size: string;
  collection: string;
  colors: string[];
  sizes: string[];
  setParam: (key: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
};

function ShopCatalogFilters({
  style,
  color,
  size,
  collection,
  colors,
  sizes,
  setParam,
  clearFilters,
  hasActiveFilters,
}: FilterParams) {
  return (
    <>
      <div className="grid min-w-0 flex-1 gap-2">
        <Label>Style</Label>
        <Select value={style || "all"} onValueChange={(v) => setParam("style", v)}>
          <SelectTrigger className="min-h-11 w-full max-w-full">
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
      <div className="grid min-w-0 flex-1 gap-2">
        <Label>Colour</Label>
        <Select value={color || "all"} onValueChange={(v) => setParam("color", v)}>
          <SelectTrigger className="min-h-11 w-full max-w-full">
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
      <div className="grid min-w-0 flex-1 gap-2">
        <Label>Size</Label>
        <Select value={size || "all"} onValueChange={(v) => setParam("size", v)}>
          <SelectTrigger className="min-h-11 w-full max-w-full">
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
        <div className="grid min-w-0 flex-1 gap-2">
          <Label>Collection</Label>
          <Select value={collection || "all"} onValueChange={(v) => setParam("collection", v)}>
            <SelectTrigger className="min-h-11 w-full max-w-full">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {hasActiveFilters ? (
        <Button type="button" variant="ghost" className="min-h-11 w-fit" onClick={clearFilters}>
          Clear filters
        </Button>
      ) : null}
    </>
  );
}

export function ShopCatalogGrid({ items }: { items: ShopCatalogItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const hasActiveFilters = Boolean(style || color || size || collection);

  const filterProps: FilterParams = {
    style,
    color,
    size,
    collection,
    colors,
    sizes,
    setParam,
    clearFilters,
    hasActiveFilters,
  };

  const activeFilterCount = [style, color, size, collection].filter(Boolean).length;

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip">
      <div className="md:hidden">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="min-h-11 w-full justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" aria-hidden />
                Filters
              </span>
              {activeFilterCount > 0 ? (
                <Badge variant="secondary" className="font-normal">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[var(--radius)]">
            <SheetHeader>
              <SheetTitle>Filter tees</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex flex-col gap-4 pb-6">{<ShopCatalogFilters {...filterProps} />}</div>
            <Button type="button" className="min-h-11 w-full" onClick={() => setFiltersOpen(false)}>
              Show {filtered.length} results
            </Button>
          </SheetContent>
        </Sheet>
      </div>

      <BoxCard
        padding="compact"
        className="hidden min-w-0 flex-col gap-4 bg-muted/30 md:flex md:flex-row md:flex-wrap md:items-end"
      >
        <ShopCatalogFilters {...filterProps} />
      </BoxCard>

      <p className="text-muted-foreground text-sm">
        Showing {filtered.length} of {items.length} tees
      </p>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">No tees match these filters.</p>
      ) : (
        <BorderedGrid columns={4} className="min-w-0 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <Link key={item.id} href={item.pdpPath as Route} className="group block min-w-0 overflow-hidden p-0">
              <BlurImage
                src={getImageSrc(item.image)}
                alt={item.title}
                width={600}
                height={600}
                className="aspect-square h-auto max-w-full w-full bg-muted object-cover transition-transform group-hover:scale-[1.02]"
              />
              <BorderedGridCell className="space-y-2 border-t">
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
              </BorderedGridCell>
            </Link>
          ))}
        </BorderedGrid>
      )}
    </div>
  );
}
