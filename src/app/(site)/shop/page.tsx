import { ShopCatalogPage } from "@/module/shop/shop-page";
import Shell from "@/shared/components/layout/shell";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";

export const metadata = buildPageMetadata({
  title: "Shop",
  description: "Shop all LUCSUM oversized tees — filter by style, colour, and size.",
  canonicalPath: "/shop",
  ogType: "website",
});

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const query = await searchParams;
  return (
    <Shell>
      <Shell.Section>
        <ShopCatalogPage searchParams={query} />
      </Shell.Section>
    </Shell>
  );
}
