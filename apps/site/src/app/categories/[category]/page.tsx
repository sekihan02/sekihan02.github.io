import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { getAllCategories, getArticlesByCategory } from "@/lib/content";
import { categoryPath, decodePathSegment } from "@/lib/routes";
import { siteConfig } from "@/lib/site";

type Props = {
  params: Promise<{
    category: string;
  }>;
};

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const decodedCategory = decodePathSegment(category);

  return {
    title: `カテゴリ: ${decodedCategory}`,
    description: `${decodedCategory} に関連する記事をまとめて見られるページです。`,
    alternates: {
      canonical: categoryPath(decodedCategory)
    },
    openGraph: {
      type: "website",
      url: categoryPath(decodedCategory),
      title: `カテゴリ: ${decodedCategory} | ${siteConfig.name}`,
      description: `${decodedCategory} に関連する記事をまとめて見られるページです。`,
      siteName: siteConfig.name,
      locale: "ja_JP"
    }
  };
}

export const dynamicParams = false;

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const decodedCategory = decodePathSegment(category);
  const articles = await getArticlesByCategory(decodedCategory);

  if (articles.length === 0) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="section-shell">
        <div className="section-head">
          <div className="section-kicker">Category</div>
          <h1>{decodedCategory}</h1>
          <p>{articles.length}本の記事を、このカテゴリからまとめて確認できます。</p>
        </div>
        <div className="article-grid">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
