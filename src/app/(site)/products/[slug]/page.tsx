import { loadProductPdpBySlug, ProductPdpPage } from "@/module/product/product-pdp-page";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";
import { absoluteUrl } from "@/shared/seo/site-origin";
import { getImageSrc } from "@/shared/utils/lib/image.utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const data = await loadProductPdpBySlug(slug);

  if (!data) {
    return buildPageMetadata({
      title: "Product not found",
      description: "This product is not available.",
      canonicalPath: `/products/${slug}`,
      robots: { index: false, follow: false },
    });
  }

  const primaryVariant = data.product.variants[0]!;
  const imageUrl = getImageSrc(primaryVariant.media?.[0]?.url) ?? getImageSrc(data.product.baseImage);
  const ogImages = imageUrl ? [imageUrl.startsWith("http") ? imageUrl : absoluteUrl(imageUrl)] : undefined;

  return buildPageMetadata({
    title: data.product.metaTitle ?? data.product.title,
    description: data.product.metaDescription ?? data.product.description ?? data.product.title,
    canonicalPath: `/products/${slug}`,
    ogImageUrls: ogImages,
    ogType: "product",
  });
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  return <ProductPdpPage slug={slug} />;
}
