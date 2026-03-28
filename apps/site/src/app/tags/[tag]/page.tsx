import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { getAllTags, getArticlesByTag } from "@/lib/content";
import { decodePathSegment, encodePathSegment, tagPath } from "@/lib/routes";
import { siteConfig } from "@/lib/site";

type Props = {
  params: Promise<{
    tag: string;
  }>;
};

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag: encodePathSegment(tag) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodePathSegment(tag);

  return {
    title: `タグ: ${decodedTag}`,
    description: `${decodedTag} に関連する記事をまとめて見られるページです。`,
    alternates: {
      canonical: tagPath(decodedTag)
    },
    openGraph: {
      type: "website",
      url: tagPath(decodedTag),
      title: `タグ: ${decodedTag} | ${siteConfig.name}`,
      description: `${decodedTag} に関連する記事をまとめて見られるページです。`,
      siteName: siteConfig.name,
      locale: "ja_JP"
    }
  };
}

export const dynamicParams = false;

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodePathSegment(tag);
  const articles = await getArticlesByTag(decodedTag);

  if (articles.length === 0) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="section-shell">
        <div className="section-head">
          <div className="section-kicker">Tag</div>
          <h1>{decodedTag}</h1>
          <p>{articles.length}本の記事を、このタグからまとめて確認できます。</p>
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
