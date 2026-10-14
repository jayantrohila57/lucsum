import { ShopCatalogPage } from "@/module/shop/shop-page";
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
  return <ShopCatalogPage searchParams={query} />;
}
