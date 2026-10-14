import type { Route } from "next";
import Link from "next/link";
import type { RouterOutputs } from "@/core/api/api.client";
import { BlurImage } from "@/shared/components/common/image";
import Section from "@/shared/components/layout/section/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PATH } from "@/shared/config/routes";
import { LUCSUM_STYLE_LABELS, LUCSUM_TRUST_FACTS } from "@/shared/config/storefront";
import { getImageSrc } from "@/shared/utils/lib/image.utils";

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
      actionLink={PATH.STORE.ROOT as Route}
    >
      {featured.length === 0 ? (
        <p className="text-muted-foreground text-sm">Products will appear here once the catalog is live.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((item) => (
            <Link key={item.id} href={item.pdpPath as Route} className="group">
              <Card className="gap-0 overflow-hidden border-border py-0">
                <CardHeader className="p-0">
                  <BlurImage
                    src={getImageSrc(item.image)}
                    alt={item.title}
                    width={480}
                    height={480}
                    className="aspect-square w-full bg-muted object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </CardHeader>
                <CardContent className="space-y-1 p-3">
                  <CardTitle className="line-clamp-2 text-sm font-medium">{item.title}</CardTitle>
                  <p className="text-sm font-semibold text-primary">{formatInr(item.priceMinor)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
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
      actionLink={PATH.STORE.ROOT as Route}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {styles.map(({ slug, title, sample }) => (
          <Link
            key={slug}
            href={`/store?style=${slug}` as Route}
            className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
          >
            <BlurImage
              src={getImageSrc(sample?.image)}
              alt={title}
              width={400}
              height={400}
              className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
            <div className="border-t p-3">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-muted-foreground text-xs">5 colours</p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

export function HomeTrustStrip() {
  return (
    <section aria-label="Why shop LUCSUM" className="border-y bg-muted/40 py-8">
      <ul className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {LUCSUM_TRUST_FACTS.map((fact) => (
          <li key={fact} className="text-center text-sm font-medium text-foreground sm:text-left">
            {fact}
          </li>
        ))}
      </ul>
    </section>
  );
}
