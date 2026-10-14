import type { Route } from "next";
import Link from "next/link";
import type { RouterOutputs } from "@/core/api/api.client";
import { BlurImage } from "@/shared/components/common/image";
import { BorderedGrid, BorderedGridCell } from "@/shared/components/layout/box";
import { boxTokens } from "@/shared/components/layout/box/box-tokens";
import Section from "@/shared/components/layout/section/section";
import { CardTitle } from "@/shared/components/ui/card";
import { PATH } from "@/shared/config/routes";
import { LUCSUM_STYLE_LABELS, LUCSUM_TRUST_FACTS } from "@/shared/config/storefront";
import { getImageSrc } from "@/shared/utils/lib/image.utils";
import { cn } from "@/shared/utils/lib/utils";

type ShopItem = NonNullable<RouterOutputs["product"]["listShopCatalog"]["data"]>[number];

function formatInr(minor: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    minor / 100,
  );
}

export function HomeFeaturedGrid({ items }: { items: ShopItem[] }) {
  const featured = items.slice(0, 8);

  return (
    <Section
      title="Featured tees"
      description="Oversized cotton tees — five styles, five colours each."
      action="Shop all"
      actionLink={PATH.SHOP.ROOT}
    >
      {featured.length === 0 ? (
        <p className="text-muted-foreground text-sm">Products will appear here once the catalog is live.</p>
      ) : (
        <BorderedGrid columns={4}>
          {featured.map((item) => (
            <Link key={item.id} href={item.pdpPath as Route} className="group block overflow-hidden p-0">
              <BlurImage
                src={getImageSrc(item.image)}
                alt={item.title}
                width={480}
                height={480}
                className="aspect-square w-full bg-muted object-cover transition-transform group-hover:scale-[1.02]"
              />
              <BorderedGridCell className="space-y-1 border-t">
                <CardTitle className="line-clamp-2 text-sm font-medium">{item.title}</CardTitle>
                <p className="text-sm font-semibold text-primary">{formatInr(item.priceMinor)}</p>
              </BorderedGridCell>
            </Link>
          ))}
        </BorderedGrid>
      )}
    </Section>
  );
}

export function HomeShopByStyle({ items }: { items: ShopItem[] }) {
  const byStyle = new Map<string, ShopItem>();
  for (const item of items) {
    if (!byStyle.has(item.styleSlug)) byStyle.set(item.styleSlug, item);
  }

  const styles = Object.keys(LUCSUM_STYLE_LABELS).map((slug) => ({
    slug,
    title: LUCSUM_STYLE_LABELS[slug] ?? slug,
    sample: byStyle.get(slug),
  }));

  return (
    <Section
      title="Shop by style"
      description="Filter the full grid by your favourite silhouette."
      action="All tees"
      actionLink={PATH.SHOP.ROOT}
    >
      <BorderedGrid columns={5}>
        {styles.map(({ slug, title, sample }) => (
          <Link key={slug} href={`/shop?style=${slug}` as Route} className="group block overflow-hidden p-0">
            <BlurImage
              src={getImageSrc(sample?.image)}
              alt={title}
              width={400}
              height={400}
              className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
            <BorderedGridCell className="border-t">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-muted-foreground text-xs">5 colours</p>
            </BorderedGridCell>
          </Link>
        ))}
      </BorderedGrid>
    </Section>
  );
}

export function HomeTrustStrip() {
  return (
    <section aria-label="Why shop LUCSUM" className={cn("border-y bg-muted/40", boxTokens.sectionY)}>
      <ul
        className={cn("mx-auto grid max-w-7xl sm:grid-cols-2 lg:grid-cols-4", boxTokens.containerX, boxTokens.gridGap)}
      >
        {LUCSUM_TRUST_FACTS.map((fact) => (
          <li key={fact} className="text-center text-sm font-medium text-foreground sm:text-left">
            {fact}
          </li>
        ))}
      </ul>
    </section>
  );
}
