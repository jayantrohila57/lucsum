import { ShopCatalogPage } from "@/module/shop/shop-page";
import Shell from "@/shared/components/layout/shell";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";

export const metadata = buildPageMetadata({
  title: "Shop",
  description: "Shop all LUCSUM oversized tees — filter by style, colour, and size.",
  canonicalPath: "/shop",
  ogType: "website",
});

export default async function ShopPage() {
  return (
    <Shell>
      <Shell.Section>
        <ShopCatalogPage />
      </Shell.Section>
    </Shell>
  );
}
