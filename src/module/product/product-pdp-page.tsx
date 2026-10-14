import { notFound } from "next/navigation";
import { apiServer, HydrateClient } from "@/core/api/api.server";
import { PDPProduct } from "@/module/product/product-pdp";
import Shell from "@/shared/components/layout/shell";
import { PATH } from "@/shared/config/routes";
import { breadcrumbGraphNode, buildSchemaGraph, digitsOnlyGtin, productWithOfferGraphNode } from "@/shared/seo/json-ld";
import { JsonLdScript } from "@/shared/seo/json-ld-script";
import { computeVariantUnitPrice, formatSchemaPrice } from "@/shared/seo/pricing";
import { seoConfig } from "@/shared/seo/seo.config";
import { absoluteUrl } from "@/shared/seo/site-origin";
import { getImageSrc } from "@/shared/utils/lib/image.utils";

type PdpData = NonNullable<Awaited<ReturnType<typeof apiServer.product.getPDPByProductSlug>>["data"]>;

export async function loadProductPdpBySlug(slug: string) {
  const { data } = await apiServer.product.getPDPByProductSlug({ params: { slug } });
  return data;
}

export function ProductPdpPageView({ slug, data }: { slug: string; data: PdpData }) {
  const primaryVariant = data.product.variants[0]!;
  const canonicalPath = PATH.PRODUCTS.PDP(slug);
  const productUrl = absoluteUrl(canonicalPath);

  const imageUrls: string[] = [];
  const pushUnique = (src: string | null | undefined) => {
    const u = src ? getImageSrc(src) : null;
    if (!u) return;
    const abs = u.startsWith("http") ? u : absoluteUrl(u);
    if (!imageUrls.includes(abs)) imageUrls.push(abs);
  };
  for (const m of primaryVariant.media ?? []) {
    pushUnique(m.url);
  }
  pushUnique(data.product.baseImage);
  const images = (imageUrls.length ? imageUrls : [absoluteUrl("/opengraph-image")]).slice(0, 20);

  const price = formatSchemaPrice(computeVariantUnitPrice(data.product, primaryVariant));
  const currency = data.product.baseCurrency ?? "INR";
  const inv = data.seo.variantInventory;
  const availability =
    inv === undefined || inv === null
      ? undefined
      : inv.availableQuantity > 0
        ? ("https://schema.org/InStock" as const)
        : ("https://schema.org/OutOfStock" as const);

  const gtin = digitsOnlyGtin(inv?.barcode ?? null) ?? undefined;
  const reviewsForProduct =
    data.seo.reviewsForSchema?.map((r) => ({
      reviewBody: r.reviewBody,
      datePublished: r.datePublished,
      ratingValue: r.ratingValue,
    })) ?? undefined;

  const pdpLd = buildSchemaGraph([
    productWithOfferGraphNode({
      name: data.product.title,
      description: (data.product.description ?? data.product.title).slice(0, 5000),
      images,
      sku: inv?.sku ?? undefined,
      gtin,
      brandName: seoConfig.siteName,
      productUrl,
      price,
      priceCurrency: currency,
      availability,
      aggregateRating: data.seo.reviewAggregate ?? undefined,
      reviews: reviewsForProduct,
    }),
    breadcrumbGraphNode([
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
      { name: data.product.title, path: canonicalPath },
    ]),
  ]);

  return (
    <HydrateClient>
      <JsonLdScript id="jsonld-pdp" data={pdpLd} />
      <Shell>
        <Shell.Section>
          <PDPProduct
            data={data}
            slug={slug}
            categorySlug={data.product.categorySlug}
            subcategorySlug={data.product.subcategorySlug}
          />
        </Shell.Section>
      </Shell>
    </HydrateClient>
  );
}

export async function ProductPdpPage({ slug }: { slug: string }) {
  const data = await loadProductPdpBySlug(slug);
  if (!data) notFound();
  return <ProductPdpPageView slug={slug} data={data} />;
}
