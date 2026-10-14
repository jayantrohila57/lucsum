import { CmsHtml } from "@/module/site/cms-html";
import { fetchSitePageBySlug, getShopifyCmsMetadata } from "@/module/site/shopify-page-loader";
import Section from "@/shared/components/layout/section/section";
import Shell from "@/shared/components/layout/shell";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  return getShopifyCmsMetadata(slug, {
    title: "Journal",
    description: "LUCSUM journal",
    canonicalPath: `/blog/${slug}`,
  });
}

export default async function BlogArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const page = await fetchSitePageBySlug(slug);

  return (
    <Shell.Section>
      <Section title={page?.title ?? "Article"} description={page?.metaDescription ?? undefined}>
        {page?.bodyHtml ? (
          <CmsHtml html={page.bodyHtml} />
        ) : (
          <p className="text-muted-foreground">Article not found.</p>
        )}
      </Section>
    </Shell.Section>
  );
}
