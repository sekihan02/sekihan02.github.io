import type { Metadata } from "next";
import Link from "next/link";
import { CategoryCollections } from "@/components/category-collections";
import { UpdateCalendar } from "@/components/update-calendar";
import { getHomeCollections } from "@/lib/content";
import { siteConfig, toAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "ZIPや圧縮の仕組みを学べる技術ログ",
  description:
    "ZIP、Deflate、LZ77、ハフマン符号などの仕組みを、実装を読みながら整理する技術記事サイトです。",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "/",
    title: siteConfig.name,
    description: "ZIP や圧縮の仕組みを、実装を読みながら学べる技術ログです。",
    siteName: siteConfig.name,
    locale: "ja_JP"
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: "ZIP や圧縮の仕組みを、実装を読みながら学べる技術ログです。"
  }
};

export default async function HomePage() {
  const { latest, calendarMonths, categoryCollections } = await getHomeCollections();
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: "ZIP、Deflate、LZ77、ハフマン符号などの仕組みを、実装を読みながら整理する技術記事サイトです。",
    inLanguage: "ja-JP"
  };
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
    inLanguage: "ja-JP",
    blogPost: latest.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      url: toAbsoluteUrl(article.url),
      datePublished: `${article.publishedAt}T00:00:00+09:00`,
      dateModified: `${(article.updatedAt ?? article.publishedAt)}T00:00:00+09:00`
    }))
  };

  return (
    <div className="page-stack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <section className="hero-shell hero-shell-single">
        <div className="hero-copy hero-copy-wide">
          <div className="section-kicker">Michikusa Log</div>
          <h1 className="home-hero-title">記事をローカルLLMと会話しつつ読める技術ログ</h1>
          <p className="home-hero-lead">日常で気になったことをログとして残します。</p>
          <div className="hero-actions">
            <Link href="/articles/" className="primary-button">
              記事を読む
            </Link>
            <Link href="/chat/" className="secondary-button">
              チャットを開く
            </Link>
          </div>

          {latest.length > 0 ? (
            <div className="hero-latest">
              <div className="section-head compact">
                <div className="section-kicker">Latest</div>
                <h2>最新記事</h2>
                <p>新しい記事から順に開けます。</p>
              </div>
              <div className="latest-entry-list">
                {latest.map((article) => (
                  <Link key={article.slug} href={article.url} className="latest-entry">
                    <span className="latest-entry-title">{article.title}</span>
                    <span className="latest-entry-meta">{article.category}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="dashboard-grid home-dashboard-grid">
        <CategoryCollections
          categories={categoryCollections}
          title="カテゴリから探す"
          description="カテゴリ名から、そのまま記事一覧へ移動できます。"
        />

        <UpdateCalendar
          months={calendarMonths}
          title="更新カレンダー"
        />
      </section>
    </div>
  );
}
