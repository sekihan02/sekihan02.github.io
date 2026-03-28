import { getAllArticles } from "@/lib/content";
import { siteConfig, toAbsoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const articles = await getAllArticles();
  const lastBuildDate = articles[0]?.updatedAt ?? articles[0]?.publishedAt ?? new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <description>${escapeXml(siteConfig.description)}</description>
    <link>${siteConfig.siteUrl}</link>
    <atom:link href="${toAbsoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
    <language>ja</language>
    <lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>
    ${articles
      .map(
        (article) => `<item>
      <title>${escapeXml(article.title)}</title>
      <link>${toAbsoluteUrl(article.url)}</link>
      <guid>${toAbsoluteUrl(article.url)}</guid>
      <pubDate>${new Date(article.updatedAt ?? article.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(article.summary)}</description>
    </item>`
      )
      .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8"
    }
  });
}
