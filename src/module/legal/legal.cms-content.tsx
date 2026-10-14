import { CmsHtml } from "@/module/site/cms-html";
import { fetchSitePageBySlug } from "@/module/site-page/site-page.fetch";
import { Card, CardContent } from "@/shared/components/ui/card";
import { sitePageSlugForLegalRoute } from "@/shared/config/shopify-pages";

export async function LegalCmsContent({ routeSlug }: { routeSlug: string }) {
  const page = await fetchSitePageBySlug(sitePageSlugForLegalRoute(routeSlug));

  if (!page?.bodyHtml) {
    return (
      <Card className="border-border bg-background p-8 shadow-sm">
        <p className="text-muted-foreground">Policy not found.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-8">
        <CmsHtml html={page.bodyHtml} />
      </CardContent>
    </Card>
  );
}
