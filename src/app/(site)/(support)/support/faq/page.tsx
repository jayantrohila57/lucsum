import { CmsHtml } from "@/module/site/cms-html";
import { fetchSitePageBySlug, getShopifyCmsMetadata } from "@/module/site/shopify-page-loader";
import Section from "@/shared/components/layout/section/section";
import Shell from "@/shared/components/layout/shell";
import { site } from "@/shared/config/site";

const fallback = {
  title: "Help centre",
  description: `Answers about orders, shipping, returns, and payments at ${site.name}.`,
  canonicalPath: "/support/faq",
};

export const generateMetadata = () => getShopifyCmsMetadata("faq", fallback);

export default async function Page() {
  const page = await fetchSitePageBySlug("faq");
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
