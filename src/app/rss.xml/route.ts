import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/core/db/db";
import { sitePage } from "@/core/db/db.schema";
import { getSiteOrigin } from "@/shared/seo/site-origin";

export async function GET() {
  const base = getSiteOrigin();
  const articles = await db.query.sitePage.findMany({
    where: and(eq(sitePage.kind, "article"), isNotNull(sitePage.publishedAt)),
    orderBy: (p, { desc }) => [desc(p.publishedAt)],
    limit: 50,
  });

  const items = articles
    .map((article) => {
      const link = `${base}/blog/${article.slug}`;
      const pubDate = article.publishedAt?.toUTCString() ?? new Date().toUTCString();
      const description = (article.bodyHtml ?? "")
        .replace(/<[^>]+>/g, " ")
        .trim()
        .slice(0, 280);
      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>LUCSUM Blog</title>
    <link>${base}/blog</link>
    <description>News and stories from LUCSUM.</description>
    <language>en-in</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
