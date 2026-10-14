import { CmsHtml } from "@/module/site/cms-html";
import { fetchSitePageBySlug, getShopifyCmsMetadata } from "@/module/site/shopify-page-loader";
import Section from "@/shared/components/layout/section/section";
import Shell from "@/shared/components/layout/shell";
import { site } from "@/shared/config/site";

const fallback = {
  title: "Shipping information",
  description: `Shipping options and delivery details for ${site.name} orders.`,
  canonicalPath: "/support/shipping",
};

export const generateMetadata = () => getShopifyCmsMetadata("shipping", fallback);

export default async function Page() {
  const page = await fetchSitePageBySlug("shipping");
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
