import { CmsHtml } from "@/module/site/cms-html";
import { fetchSitePageBySlug, getShopifyCmsMetadata } from "@/module/site/shopify-page-loader";
import Section from "@/shared/components/layout/section/section";
import Shell from "@/shared/components/layout/shell";
import { site } from "@/shared/config/site";

const fallback = {
  title: "About",
  description: `Learn more about ${site.name}.`,
  canonicalPath: "/marketing/about",
};

export const generateMetadata = () => getShopifyCmsMetadata("about", fallback);

export default async function Page() {
  const page = await fetchSitePageBySlug("about");
  return (
    <Shell>
      <Shell.Section>
        <Section title={page?.title ?? fallback.title} description={page?.metaDescription ?? fallback.description}>
          {page?.bodyHtml ? (
            <CmsHtml html={page.bodyHtml} />
          ) : (
            <p className="text-muted-foreground">{fallback.description}</p>
          )}
        </Section>
      </Shell.Section>
    </Shell>
  );
}
