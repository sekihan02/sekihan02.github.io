import Link from "next/link";
import type { RelatedArticle } from "@/lib/types";

type Props = {
  articles: RelatedArticle[];
};

export function RelatedArticles({ articles }: Props) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="related-shell">
      <div className="section-kicker">Related</div>
      <h2>関連記事</h2>
      <div className="related-grid">
        {articles.map((article) => (
          <article key={article.slug} className="related-card">
            <h3>
              <Link href={article.url}>{article.title}</Link>
            </h3>
            <p className="related-score">関連度 {article.score.toFixed(2)}</p>
            <div className="tag-row">
              {article.reasons.map((reason) => (
                <span key={reason} className="tag-pill subtle">
                  {reason}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
