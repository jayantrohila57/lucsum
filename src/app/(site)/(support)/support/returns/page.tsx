import { CmsHtml } from "@/module/site/cms-html";
import { fetchSitePageBySlug, getShopifyCmsMetadata } from "@/module/site/shopify-page-loader";
import Section from "@/shared/components/layout/section/section";
import Shell from "@/shared/components/layout/shell";
import { site } from "@/shared/config/site";

const fallback = {
  title: "Returns & refunds",
  description: `Return and refund policy for ${site.name}.`,
  canonicalPath: "/support/returns",
};

export const generateMetadata = () => getShopifyCmsMetadata("returns-refunds", fallback);

export default async function Page() {
  const page = await fetchSitePageBySlug("returns-refunds");
  return (
    <Shell.Section>
      <Section title={page?.title ?? fallback.title} description={page?.metaDescription ?? fallback.description}>
        {page?.bodyHtml ? (
          <CmsHtml html={page.bodyHtml} />
        ) : (
          <p className="text-muted-foreground">{fallback.description}</p>
        )}
      </Section>
    </Shell.Section>
  );
}
