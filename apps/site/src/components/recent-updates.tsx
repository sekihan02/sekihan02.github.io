import Link from "next/link";
import { getArticleStatusLabel } from "@/lib/article-state";
import { formatJapaneseDate } from "@/lib/site";
import type { UpdateEntry } from "@/lib/types";

type Props = {
  entries: UpdateEntry[];
  title?: string;
  description?: string;
};

export function RecentUpdates({
  entries,
  title = "最近の更新",
  description = "公開、更新、未公開の準備中記事を新しい順に並べています。"
}: Props) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="section-shell">
      <div className="section-head">
        <div className="section-kicker">Recent Activity</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="update-feed">
        {entries.map((entry) => (
          <article key={`${entry.date}-${entry.kind}-${entry.article.slug}`} className="update-card">
            <div className="article-row-meta">
              <span className={`status-pill status-pill-${entry.kind}`}>{getArticleStatusLabel(entry.kind)}</span>
              <span>{formatJapaneseDate(entry.date)}</span>
              <span>{entry.article.category}</span>
            </div>
            <h3>
              <Link href={entry.article.url}>{entry.article.title}</Link>
            </h3>
            <p>{entry.article.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
