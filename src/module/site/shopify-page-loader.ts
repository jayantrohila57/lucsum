import { fetchSitePageBySlug } from "@/module/site-page/site-page.fetch";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";

export async function getShopifyCmsMetadata(
  slug: string,
  fallback: { title: string; description: string; canonicalPath: string },
) {
  const page = await fetchSitePageBySlug(slug);
  return buildPageMetadata({
    title: page?.metaTitle ?? page?.title ?? fallback.title,
    description: page?.metaDescription ?? fallback.description,
    canonicalPath: fallback.canonicalPath,
    ogType: "website",
  });
}

export { fetchSitePageBySlug };
