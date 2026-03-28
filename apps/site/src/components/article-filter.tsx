"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { getArticleStatus, getArticleStatusLabel } from "@/lib/article-state";
import type { ArticleSummary, CategoryCollection } from "@/lib/types";
import { formatJapaneseDate } from "@/lib/site";

type Props = {
  articles: ArticleSummary[];
  categories: CategoryCollection[];
};

const PAGE_SIZE_OPTIONS = [10, 50] as const;

export function ArticleFilter({ articles, categories }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("ja");

  const filtered = articles.filter((article) => {
    if (activeCategory !== "all" && article.category !== activeCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${article.title} ${article.summary} ${article.category} ${article.tags.join(" ")}`.toLocaleLowerCase(
      "ja"
    );
    return haystack.includes(normalizedQuery);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(filtered.length, safePage * pageSize);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, activeCategory, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function renderPager(position: "top" | "bottom") {
    if (filtered.length === 0) {
      return null;
    }

    return (
      <div className={`archive-pager archive-pager-${position}`}>
        <div className="archive-range">
          {startIndex}-{endIndex} / {filtered.length}件
        </div>
        <div className="archive-pager-actions">
          <button type="button" className="secondary-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1}>
            前へ
          </button>
          <span className="archive-page-indicator">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={safePage === totalPages}
          >
            次へ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="filter-shell archive-filter-shell">
      <div className="filter-heading">
        <div>
          <div className="section-kicker">Archive</div>
          <h2>記事を探す</h2>
          <p>タイトル、キーワード、カテゴリから絞り込めます。</p>
        </div>
      </div>

      <div className="archive-controls">
        <label className="search-field archive-search">
          <span>検索</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="キーワードで探す"
          />
        </label>

        <label className="select-field archive-page-size">
          <span>表示件数</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}件
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filter-pills" aria-label="カテゴリ絞り込み">
        <button
          type="button"
          className={`filter-pill ${activeCategory === "all" ? "filter-pill-active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          すべて
          <span>{articles.length}</span>
        </button>
        {categories.map((category) => (
          <button
            key={category.category}
            type="button"
            className={`filter-pill ${activeCategory === category.category ? "filter-pill-active" : ""}`}
            onClick={() => setActiveCategory(category.category)}
          >
            {category.category}
            <span>{category.articleCount}</span>
          </button>
        ))}
      </div>

      {renderPager("top")}

      {visible.length > 0 ? (
        <div className="archive-results">
          {visible.map((article) => {
            const articleState = getArticleStatus(article);

            return (
              <article key={article.slug} className="archive-row">
                <div className="article-row-meta">
                  <span className={`status-pill status-pill-${articleState}`}>{getArticleStatusLabel(articleState)}</span>
                  <button type="button" className="meta-filter-button" onClick={() => setActiveCategory(article.category)}>
                    {article.category}
                  </button>
                  <span>公開 {formatJapaneseDate(article.publishedAt)}</span>
                  <span>更新 {formatJapaneseDate(article.updatedAt ?? article.publishedAt)}</span>
                </div>
                <h3>
                  <Link href={article.url}>{article.title}</Link>
                </h3>
                <p>{article.summary}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="archive-empty">
          <strong>一致する記事がありません。</strong>
          <p>検索語を短くするか、カテゴリの絞り込みを解除してください。</p>
        </div>
      )}

      {renderPager("bottom")}
    </div>
  );
}
