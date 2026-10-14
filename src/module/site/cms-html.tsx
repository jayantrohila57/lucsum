import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/shared/utils/lib/utils";

/** Renders Shopify-exported HTML bodies (sanitized). */
export function CmsHtml({ html, className }: { html: string; className?: string }) {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized CMS HTML only.
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
