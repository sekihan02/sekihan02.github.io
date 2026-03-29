import { getAllArticles } from "@/lib/content";
import { toAbsoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildEntry(url: string, lastModified: string) {
  return [
    "  <url>",
    `    <loc>${escapeXml(url)}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    "  </url>",
  ].join("\n");
}

export async function GET() {
  const articles = await getAllArticles();
  const latestArticleDate = articles[0]?.updatedAt ?? articles[0]?.publishedAt ?? new Date().toISOString().slice(0, 10);
  const entries = [
    buildEntry(toAbsoluteUrl("/"), latestArticleDate),
    buildEntry(toAbsoluteUrl("/articles/"), latestArticleDate),
    ...articles.map((article) => buildEntry(toAbsoluteUrl(article.url), article.updatedAt ?? article.publishedAt)),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  });
}
