import { getAllArticles, getAllCategories, getAllTags } from "@/lib/content";
import { categoryPath, tagPath } from "@/lib/routes";
import { toAbsoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export async function GET() {
  const [articles, tags, categories] = await Promise.all([getAllArticles(), getAllTags(), getAllCategories()]);
  const urls = Array.from(
    new Set([
      toAbsoluteUrl("/"),
      toAbsoluteUrl("/articles/"),
      ...categories.map((category) => toAbsoluteUrl(categoryPath(category))),
      ...tags.map((tag) => toAbsoluteUrl(tagPath(tag))),
      ...articles.map((article) => toAbsoluteUrl(article.url)),
    ])
  );

  return new Response(`${urls.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
