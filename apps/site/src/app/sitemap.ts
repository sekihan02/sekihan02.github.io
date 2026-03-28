import type { MetadataRoute } from "next";
import { getAllArticles, getAllCategories, getAllTags } from "@/lib/content";
import { categoryPath, tagPath } from "@/lib/routes";
import { toAbsoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

function getLatestArticleDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, tags, categories] = await Promise.all([getAllArticles(), getAllTags(), getAllCategories()]);
  const latestArticleDate = articles[0]?.updatedAt ?? articles[0]?.publishedAt ?? getLatestArticleDate();

  return [
    {
      url: toAbsoluteUrl("/"),
      lastModified: latestArticleDate,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: toAbsoluteUrl("/articles/"),
      lastModified: latestArticleDate,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: toAbsoluteUrl("/chat/"),
      lastModified: latestArticleDate,
      changeFrequency: "weekly",
      priority: 0.5
    },
    ...articles.map((article) => ({
      url: toAbsoluteUrl(article.url),
      lastModified: article.updatedAt ?? article.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...tags.map((tag) => ({
      url: toAbsoluteUrl(tagPath(tag)),
      lastModified: latestArticleDate,
      changeFrequency: "weekly" as const,
      priority: 0.6
    })),
    ...categories.map((category) => ({
      url: toAbsoluteUrl(categoryPath(category)),
      lastModified: latestArticleDate,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];
}
