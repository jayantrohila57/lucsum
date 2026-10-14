import { notFound } from "next/navigation";
import { apiServer, HydrateClient } from "@/core/api/api.server";
import { CategoryItem } from "@/module/category/category.component.all";
import Section from "@/shared/components/layout/section/section";
import { StoreSubNav } from "@/shared/components/layout/section/store-sub-nav";
import Shell from "@/shared/components/layout/shell";
import { PATH } from "@/shared/config/routes";
import {
  breadcrumbGraphNode,
  buildSchemaGraph,
  collectionPageGraphNode,
  itemListGraphNode,
} from "@/shared/seo/json-ld";
import { JsonLdScript } from "@/shared/seo/json-ld-script";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";
import { absoluteUrl } from "@/shared/seo/site-origin";
import { getImageSrc } from "@/shared/utils/lib/image.utils";

export async function generateMetadata({ params }: PageProps<"/store/[categorySlug]">) {
  const { categorySlug: slug } = await params;
  const { data: category } = await apiServer.category.get({
    params: {
      slug,
    },
  });

  if (!category) return notFound();

  const title = category.metaTitle ?? category.title;
  const description = category.metaDescription ?? category.description ?? category.title;
  const imageUrl = getImageSrc(category.image);
  const ogImages = imageUrl ? [imageUrl.startsWith("http") ? imageUrl : absoluteUrl(imageUrl)] : undefined;

  return buildPageMetadata({
    title,
    description,
    canonicalPath: `/store/${slug}`,
    ogImageUrls: ogImages,
    ogType: "website",
  });
}

export default async function CategoryPage({ params }: PageProps<"/store/[categorySlug]">) {
  const { categorySlug: slug } = await params;
  const { data } = await apiServer.category.getCategoryWithSubCategories({
    params: {
      slug,
    },
  });
  if (!data) return notFound();

  const categoryLd = buildSchemaGraph([
    collectionPageGraphNode({
      name: data.title,
      description: data.description ?? data.metaDescription ?? data.title,
      path: `/store/${slug}`,
    }),
    itemListGraphNode({
      name: `Subcategories in ${data.title}`,
      path: `/store/${slug}`,
      idSuffix: "subcategories",
      items: (data.subcategories ?? []).map((s) => ({
        name: s.title,
        url: absoluteUrl(PATH.STORE.SUB_CATEGORIES.SUBCATEGORY(s.slug, slug)),
      })),
    }),
    breadcrumbGraphNode([
      { name: "Home", path: "/" },
      { name: "Store", path: "/store" },
      { name: data.title, path: `/store/${slug}` },
    ]),
  ]);

  return (
    <HydrateClient>
      <JsonLdScript id="jsonld-category" data={categoryLd} />
      <StoreSubNav />
      <Shell>
        <Shell.Section>
          <Section title={`Shop ${data.title}`} description={data.description ?? ""}>
            <CategoryItem data={data} />
          </Section>
        </Shell.Section>
      </Shell>
    </HydrateClient>
  );
}
