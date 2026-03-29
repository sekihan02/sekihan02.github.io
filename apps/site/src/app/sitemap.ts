import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";
import { toAbsoluteUrl } from "@/lib/site";

function toLastModified(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();
  const latestArticleDate = articles[0]?.updatedAt ?? articles[0]?.publishedAt ?? new Date().toISOString().slice(0, 10);

  return [
    {
      url: toAbsoluteUrl("/"),
      lastModified: toLastModified(latestArticleDate),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: toAbsoluteUrl("/articles/"),
      lastModified: toLastModified(latestArticleDate),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...articles.map((article) => ({
      url: toAbsoluteUrl(article.url),
      lastModified: toLastModified(article.updatedAt ?? article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
