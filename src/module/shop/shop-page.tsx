import { LayoutGrid } from "lucide-react";
import { apiServer } from "@/core/api/api.server";
import { ShopCatalogGrid } from "@/module/shop/shop-catalog-grid";
import { ContentEmpty } from "@/shared/components/common/content-empty";
import Section from "@/shared/components/layout/section/section";
import { PATH } from "@/shared/config/routes";
import { site } from "@/shared/config/site";
import { buildSchemaGraph, collectionPageGraphNode, itemListGraphNode } from "@/shared/seo/json-ld";
import { JsonLdScript } from "@/shared/seo/json-ld-script";
import { absoluteUrl } from "@/shared/seo/site-origin";

export async function ShopCatalogPage({
  searchParams = {},
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
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
          <ShopCatalogGrid items={catalogItems} serverSearchParams={searchParams} />
        )}
      </Section>
    </>
  );
}
