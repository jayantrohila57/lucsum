import { LayoutGrid } from "lucide-react";
import type { Route } from "next";
import { Suspense } from "react";
import { apiServer } from "@/core/api/api.server";
import CategoryCard from "@/module/category/category-card";
import { ShopCatalogGrid } from "@/module/shop/shop-catalog-grid";
import { ContentEmpty } from "@/shared/components/common/content-empty";
import Section from "@/shared/components/layout/section/section";
import { StoreSubNav } from "@/shared/components/layout/section/store-sub-nav";
import Shell from "@/shared/components/layout/shell";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { PATH } from "@/shared/config/routes";
import { site } from "@/shared/config/site";
import { storefrontFeatures } from "@/shared/config/storefront";
import { buildSchemaGraph, collectionPageGraphNode, itemListGraphNode } from "@/shared/seo/json-ld";
import { JsonLdScript } from "@/shared/seo/json-ld-script";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";
import { absoluteUrl } from "@/shared/seo/site-origin";

export const metadata = buildPageMetadata({
  title: storefrontFeatures.simplifiedShop ? "Shop all tees" : "Store",
  description: storefrontFeatures.simplifiedShop
    ? `Shop all LUCSUM oversized tees — filter by style, colour, and size.`
    : `Shop ${site.name} — browse categories and discover products.`,
  canonicalPath: "/store",
  ogType: "website",
});

type CategoryWithSubs = NonNullable<
  Awaited<ReturnType<typeof apiServer.category.getManyWithSubcategories>>["data"]
>[number];

function filterCategoriesByQuery(categories: CategoryWithSubs[] | null | undefined, qRaw: string): CategoryWithSubs[] {
  if (!categories?.length) return [];
  const q = qRaw.trim().toLowerCase();
  if (!q) return categories;

  return categories
    .map((cat) => {
      const catMatch = cat.title.toLowerCase().includes(q) || (cat.description?.toLowerCase().includes(q) ?? false);
      if (catMatch) return cat;
      const subs = cat.subcategories?.filter(
        (sub) => sub.title.toLowerCase().includes(q) || (sub.description?.toLowerCase().includes(q) ?? false),
      );
      if (!subs?.length) return null;
      return { ...cat, subcategories: subs };
    })
    .filter((c): c is CategoryWithSubs => c != null);
}

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

async function SimplifiedShopPage() {
  const { data: items } = await apiServer.product.listShopCatalog({});

  const catalogItems = items ?? [];
  const listItems = catalogItems.map((item) => ({
    name: item.title,
    url: absoluteUrl(item.pdpPath),
  }));

  const storeLd = buildSchemaGraph([
    collectionPageGraphNode({
      name: "Shop",
      description: "All LUCSUM oversized t-shirt colourways.",
      path: "/store",
    }),
    itemListGraphNode({
      name: "LUCSUM tees",
      description: "Shop all live colourway products.",
      path: "/store",
      idSuffix: "catalog",
      items: listItems,
    }),
  ]);

  return (
    <>
      <JsonLdScript id="jsonld-store" data={storeLd} />
      <StoreSubNav />
      <Shell.Section>
        <Section title="Shop all tees" description="25 colourways · filter by style, colour, size, or collection">
          {catalogItems.length === 0 ? (
            <ContentEmpty
              icon={LayoutGrid}
              className="mx-auto max-w-lg"
              title="Catalog is empty"
              description="Live tees will appear here once products are published."
              primaryAction={{ label: "Home", href: PATH.ROOT }}
              secondaryAction={{ label: "Contact", href: PATH.SITE.CONTACT }}
            />
          ) : (
            <Suspense fallback={<ShopGridFallback />}>
              <ShopCatalogGrid items={catalogItems} />
            </Suspense>
          )}
        </Section>
      </Shell.Section>
    </>
  );
}

export default async function StorePage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  if (storefrontFeatures.simplifiedShop) {
    return (
      <Shell>
        <SimplifiedShopPage />
      </Shell>
    );
  }

  const sp = await searchParams;
  const rawQ = sp?.q;
  const q = typeof rawQ === "string" ? rawQ : Array.isArray(rawQ) ? (rawQ[0] ?? "") : "";

  const { data } = await apiServer.category.getManyWithSubcategories({
    query: {},
  });

  const filtered = filterCategoriesByQuery(data, q);
  const categoriesForDisplay = filtered.map((c) => ({ ...c, subcategories: c.subcategories ?? [] }));

  const listItems = categoriesForDisplay.flatMap((category) => {
    const subs = category.subcategories ?? [];
    if (subs.length === 0) {
      return [
        {
          name: category.title,
          url: absoluteUrl(PATH.STORE.CATEGORIES.CATEGORY(category.slug)),
        },
      ];
    }
    return subs.map((sub) => ({
      name: `${category.title} — ${sub.title}`,
      url: absoluteUrl(PATH.STORE.SUB_CATEGORIES.SUBCATEGORY(sub.slug, category.slug)),
    }));
  });

  const storeLd = buildSchemaGraph([
    collectionPageGraphNode({
      name: "Store",
      description: `Shop ${site.name} — browse categories and discover products.`,
      path: "/store",
    }),
    itemListGraphNode({
      name: q.trim() ? `Store results for “${q.trim()}”` : "Store categories and subcategories",
      description: q.trim()
        ? "Subcategories matching your search on the store."
        : "Browse categories and subcategories from the store.",
      path: "/store",
      idSuffix: "catalog",
      items: listItems,
    }),
  ]);

  return (
    <Shell>
      <JsonLdScript id="jsonld-store" data={storeLd} />
      <StoreSubNav />
      <Shell.Section>
        {q.trim() && categoriesForDisplay.length === 0 ? (
          <ContentEmpty
            className="mx-auto max-w-lg"
            title="No matches"
            description={`No categories or subcategories match "${q.trim()}". Try a different search term or browse the full store.`}
            primaryAction={{ label: "Clear search", href: "/store" }}
            secondaryAction={{ label: "All categories", href: PATH.STORE.CATEGORIES.ROOT }}
          />
        ) : !q.trim() && categoriesForDisplay.length === 0 ? (
          <ContentEmpty
            icon={LayoutGrid}
            className="mx-auto max-w-lg"
            title="Store catalog is empty"
            description="There are no categories with products to browse yet. Check back soon, or contact us if you expected to see listings here."
            primaryAction={{ label: "Home", href: PATH.ROOT }}
            secondaryAction={{ label: "Contact support", href: PATH.SITE.CONTACT }}
          />
        ) : (
          categoriesForDisplay.map((category) => (
            <Section
              key={category.id}
              title={category.title}
              description={category.description ?? ""}
              action="View All "
              actionLink={PATH.STORE.CATEGORIES.CATEGORY(category.slug) as Route}
            >
              {category.subcategories.length > 0 ? (
                <div className="mb-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {category.subcategories.map((subcategory) => (
                    <CategoryCard
                      key={subcategory.id}
                      id={subcategory.id}
                      href={PATH.STORE.SUB_CATEGORIES.SUBCATEGORY(subcategory?.slug, category.slug) as Route}
                      title={subcategory.title}
                      description={subcategory.description}
                      image={subcategory.image}
                    />
                  ))}
                </div>
              ) : (
                <div className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <CategoryCard
                    id={category.id}
                    href={PATH.STORE.CATEGORIES.CATEGORY(category.slug) as Route}
                    title={category.title}
                    description={category.description}
                    image={category.image}
                  />
                  <p className="text-muted-foreground max-w-md text-sm sm:pt-4">
                    Subcollections will appear here once they are published. Open the category to browse when available.
                  </p>
                </div>
              )}
            </Section>
          ))
        )}
      </Shell.Section>
    </Shell>
  );
}
