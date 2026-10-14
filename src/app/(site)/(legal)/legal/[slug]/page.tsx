import { LegalCmsContent } from "@/module/legal/legal.cms-content";
import { LegalSidebar } from "@/module/legal/legal.sidebar";
import { fetchSitePageBySlug } from "@/module/site-page/site-page.fetch";
import Section from "@/shared/components/layout/section/section";
import { sitePageSlugForLegalRoute } from "@/shared/config/shopify-pages";
import { buildPageMetadata } from "@/shared/seo/metadata-builders";

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const page = await fetchSitePageBySlug(sitePageSlugForLegalRoute(slug));
  return buildPageMetadata({
    title: page?.metaTitle ?? page?.title ?? "Legal",
    description: page?.metaDescription ?? "LUCSUM legal policy",
    canonicalPath: `/legal/${slug}`,
    ogType: "article",
  });
}

export default async function Page({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const page = await fetchSitePageBySlug(sitePageSlugForLegalRoute(slug));
  return (
    <Section title={page?.title ?? "Legal"} description={page?.metaDescription ?? undefined}>
      <div className="grid h-full w-full grid-cols-12 gap-4">
        <div className="col-span-2 h-full w-full">
          <LegalSidebar activeSection={slug} />
        </div>
        <div className="col-span-10 h-full w-full">
          <LegalCmsContent routeSlug={slug} />
        </div>
      </div>
    </Section>
  );
}
