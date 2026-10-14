import { apiServer, HydrateClient } from "@/core/api/api.server";
import CategoriesListing from "@/module/category/category.component.listing";
import Section from "@/shared/components/layout/section/section";
import { StoreSubNav } from "@/shared/components/layout/section/store-sub-nav";
import Shell from "@/shared/components/layout/shell";
import { PATH } from "@/shared/config/routes";
import { site } from "@/shared/config/site";
import { buildSchemaGraph, collectionPageGraphNode, itemListGraphNode } from "@/shared/seo/json-ld";
import { JsonLdScript } from "@/shared/seo/json-ld-script";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";
import { absoluteUrl } from "@/shared/seo/site-origin";

const pageHeading = {
  title: "Categories",
  description: `Browse all product categories at ${site.name}.`,
};

export const metadata = buildPageMetadata({
  title: pageHeading.title,
  description: pageHeading.description,
  canonicalPath: "/store/categories",
  ogType: "website",
});

export default async function CategoriesPage() {
  const { data } = await apiServer.category.getMany({
    query: {},
  });

  const categories = data ?? [];
  const categoriesLd = buildSchemaGraph([
    collectionPageGraphNode({
      name: pageHeading.title,
      description: pageHeading.description,
      path: "/store/categories",
    }),
    itemListGraphNode({
      name: "All product categories",
      description: pageHeading.description,
      path: "/store/categories",
      idSuffix: "all",
      items: categories.map((c) => ({
        name: c.title,
        url: absoluteUrl(PATH.STORE.CATEGORIES.CATEGORY(c.slug)),
      })),
    }),
  ]);

  return (
    <Shell>
      <JsonLdScript id="jsonld-categories-index" data={categoriesLd} />
      <StoreSubNav />
      <Shell.Section>
        <HydrateClient>
          <Section {...pageHeading}>
            <CategoriesListing data={data} />
          </Section>
        </HydrateClient>
      </Shell.Section>
    </Shell>
  );
}
