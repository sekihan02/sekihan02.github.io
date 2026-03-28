import type { ArticleStatus, ArticleSummary } from "@/lib/types";

export function getArticleStatus(article: Pick<ArticleSummary, "draft" | "publishedAt" | "updatedAt">): ArticleStatus {
  if (article.draft) {
    return "draft";
  }

  if (article.updatedAt && article.updatedAt > article.publishedAt) {
    return "updated";
  }

  return "published";
}

export function getArticleStatusLabel(status: ArticleStatus) {
  switch (status) {
    case "draft":
      return "未公開";
    case "updated":
      return "更新";
    default:
      return "公開";
  }
}
