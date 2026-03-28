import type { Metadata } from "next";
import { ArticleFilter } from "@/components/article-filter";
import { getAllArticles, getCategoryCollections } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "記事一覧",
  description: "ZIP、Deflate、LZ77、ハフマン符号などの記事を一覧で探せます。",
  alternates: {
    canonical: "/articles/"
  },
  openGraph: {
    type: "website",
    url: "/articles/",
    title: `記事一覧 | ${siteConfig.name}`,
    description: "ZIP、Deflate、LZ77、ハフマン符号などの記事を一覧で探せます。",
    siteName: siteConfig.name,
    locale: "ja_JP"
  },
  twitter: {
    card: "summary",
    title: `記事一覧 | ${siteConfig.name}`,
    description: "ZIP、Deflate、LZ77、ハフマン符号などの記事を一覧で探せます。"
  }
};

export default async function ArticlesPage() {
  const [articles, categoryCollections] = await Promise.all([
    getAllArticles(),
    getCategoryCollections(20)
  ]);

  return (
    <div className="page-stack">
      <section className="section-shell">
        <div className="section-head">
          <div className="section-kicker">Archive</div>
          <h1>記事一覧</h1>
          <p>タイトル、検索、カテゴリから記事を探せます。</p>
        </div>
      </section>

      <section className="section-shell">
        <ArticleFilter articles={articles} categories={categoryCollections} />
      </section>
    </div>
  );
}
