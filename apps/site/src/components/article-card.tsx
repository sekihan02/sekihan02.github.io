import Link from "next/link";
import { getArticleStatus, getArticleStatusLabel } from "@/lib/article-state";
import type { ArticleSummary } from "@/lib/types";
import { formatJapaneseDate } from "@/lib/site";
import { categoryPath, tagPath } from "@/lib/routes";

type Props = {
  article: ArticleSummary;
  accent?: string;
};

export function ArticleCard({ article, accent = "sage" }: Props) {
  const articleState = getArticleStatus(article);

  return (
    <article className={`article-card article-card-${accent}`}>
      <div className="article-card-meta">
        <span className={`status-pill status-pill-${articleState}`}>{getArticleStatusLabel(articleState)}</span>
        <Link href={categoryPath(article.category)} className="meta-link">
          {article.category}
        </Link>
        <span>公開 {formatJapaneseDate(article.publishedAt)}</span>
        <span>更新 {formatJapaneseDate(article.updatedAt ?? article.publishedAt)}</span>
        <span>{article.readingTimeMinutes}分</span>
      </div>
      <h3>
        <Link href={article.url} className="article-card-link">
          {article.title}
        </Link>
      </h3>
      <p>{article.summary}</p>
      <div className="tag-row">
        {article.tags.map((tag) => (
          <Link key={tag} href={tagPath(tag)} className="tag-pill">
            {tag}
          </Link>
        ))}
      </div>
    </article>
  );
}
