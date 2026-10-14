import { apiServer } from "@/core/api/api.server";
import GetFeaturedCategories from "@/module/category/category.get-featured";
import ShopByCategoryGrid from "@/module/category/category.shop-by";
import SiteHero from "@/module/site/site.hero";
import Shell from "@/shared/components/layout/shell";
import { isLucsumCatalogCategorySlug } from "@/shared/config/catalog";
import { PATH } from "@/shared/config/routes";
import { site } from "@/shared/config/site";
import { buildSchemaGraph, itemListGraphNode, webPageGraphNode } from "@/shared/seo/json-ld";
import { JsonLdScript } from "@/shared/seo/json-ld-script";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";
import { absoluteUrl } from "@/shared/seo/site-origin";

export const metadata = buildPageMetadata({
  title: "Home",
  description: site.description,
  canonicalPath: "/",
  ogType: "website",
});

export default async function Home({}: PageProps<"/">) {
  const [featuredRes, categoriesRes] = await Promise.all([
    apiServer.category.getAllFeaturedCategories({ query: {} }),
    apiServer.category.getMany({ query: {} }),
  ]);

  const featured = featuredRes.data ?? [];
  const shopCategories = (categoriesRes.data ?? []).filter((c) => isLucsumCatalogCategorySlug(c.slug)).slice(0, 4);

  const homeLd = buildSchemaGraph([
    webPageGraphNode({
      name: "Home",
      description: site.description,
      path: "/",
    }),
    itemListGraphNode({
      name: "Featured categories",
      description: "Explore our featured categories",
      path: "/",
      idSuffix: "featured",
      items: featured.map((c) => ({
        name: c.title,
        url: absoluteUrl(PATH.STORE.CATEGORIES.CATEGORY(c.slug)),
      })),
    }),
    itemListGraphNode({
      name: "Shop by category",
      description: "Explore our products by category",
      path: "/",
      idSuffix: "shop-by-category",
      items: shopCategories.map((c) => ({
        name: c.title,
        url: absoluteUrl(PATH.STORE.CATEGORIES.CATEGORY(c.slug)),
      })),
    }),
  ]);

  return (
    <Shell>
      <JsonLdScript id="jsonld-home" data={homeLd} />
      <Shell.Section>
        <SiteHero />
      </Shell.Section>
      <Shell.Section>
        <GetFeaturedCategories prefetched={featured} />
      </Shell.Section>
      <Shell.Section>
        <ShopByCategoryGrid prefetched={shopCategories} />
      </Shell.Section>
    </Shell>
  );
}
