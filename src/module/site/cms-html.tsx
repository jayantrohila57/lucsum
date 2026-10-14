import { cn } from "@/shared/utils/lib/utils";

/** Renders Shopify-exported HTML bodies (trusted CMS source). */
export function CmsHtml({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is authored in Shopify export / site_page CMS only.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
