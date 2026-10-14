import { LayoutGrid } from "lucide-react";
import { Suspense } from "react";
import { apiServer } from "@/core/api/api.server";
import { ShopCatalogGrid } from "@/module/shop/shop-catalog-grid";
import { ContentEmpty } from "@/shared/components/common/content-empty";
import Section from "@/shared/components/layout/section/section";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { PATH } from "@/shared/config/routes";
import { site } from "@/shared/config/site";
import { buildSchemaGraph, collectionPageGraphNode, itemListGraphNode } from "@/shared/seo/json-ld";
import { JsonLdScript } from "@/shared/seo/json-ld-script";
import { absoluteUrl } from "@/shared/seo/site-origin";

function ShopGridFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export async function ShopCatalogPage() {
  const { data: items } = await apiServer.product.listShopCatalog({});
  const catalogItems = items ?? [];
  const listItems = catalogItems.map((item) => ({
    name: item.title,
    url: absoluteUrl(item.pdpPath),
  }));

  const storeLd = buildSchemaGraph([
    collectionPageGraphNode({
      name: "Shop",
      description: `Shop all ${site.name} oversized tees.`,
      path: "/shop",
    }),
    itemListGraphNode({
      name: "LUCSUM tees",
      description: "All live colourway products.",
      path: "/shop",
      idSuffix: "catalog",
      items: listItems,
    }),
  ]);

  return (
    <>
      <JsonLdScript id="jsonld-shop" data={storeLd} />
      <Section title="Shop all tees" description="25 colourways · filter by style, colour, and size">
        {catalogItems.length === 0 ? (
          <ContentEmpty
            icon={LayoutGrid}
            className="mx-auto max-w-lg"
            title="Catalog is empty"
            description="Live tees will appear here once products are published."
            primaryAction={{ label: "Home", href: PATH.ROOT }}
            secondaryAction={{ label: "Help", href: PATH.HELP }}
          />
        ) : (
          <Suspense fallback={<ShopGridFallback />}>
            <ShopCatalogGrid items={catalogItems} />
          </Suspense>
        )}
      </Section>
    </>
  );
}
