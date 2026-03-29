import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { ChatWidget } from "@/components/chat-widget";
import { mdxComponents } from "@/components/mdx-components";
import { RelatedArticles } from "@/components/related-articles";
import { getArticleStatus, getArticleStatusLabel } from "@/lib/article-state";
import { getAllArticles, getArticleBySlug, getArticleSlugs, getRelatedArticles } from "@/lib/content";
import { categoryPath, tagPath } from "@/lib/routes";
import { formatJapaneseDate, siteConfig, toAbsoluteUrl } from "@/lib/site";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: article.url,
    },
    openGraph: {
      type: "article",
      url: article.url,
      title: article.title,
      description: article.summary,
      siteName: siteConfig.name,
      locale: "ja_JP",
      publishedTime: `${article.publishedAt}T00:00:00+09:00`,
      modifiedTime: `${article.updatedAt ?? article.publishedAt}T00:00:00+09:00`,
      tags: article.tags,
    },
    twitter: {
      card: "summary",
      title: article.title,
      description: article.summary,
    },
  };
}

export const dynamicParams = false;

function slugifyHeading(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ja")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function extractHeadings(body: string) {
  return body
    .split("\n")
    .map((line) => /^(##|###)\s+(.+)$/.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => ({
      depth: match[1].length,
      title: match[2].trim(),
      id: slugifyHeading(match[2]),
    }));
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const [allArticles, related] = await Promise.all([getAllArticles(), getRelatedArticles(article.slug)]);
  const headings = extractHeadings(article.body);
  const articleState = getArticleStatus(article);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    inLanguage: "ja-JP",
    articleSection: article.category,
    keywords: article.tags.join(", "),
    url: toAbsoluteUrl(article.url),
    mainEntityOfPage: toAbsoluteUrl(article.url),
    datePublished: `${article.publishedAt}T00:00:00+09:00`,
    dateModified: `${article.updatedAt ?? article.publishedAt}T00:00:00+09:00`,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "道草ログ",
        item: siteConfig.siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "記事一覧",
        item: toAbsoluteUrl("/articles"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: toAbsoluteUrl(article.url),
      },
    ],
  };

  return (
    <div className="page-stack">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="article-shell">
        <header className="article-hero">
          <div className="section-kicker">
            <Link href={categoryPath(article.category)} className="meta-link">
              {article.category}
            </Link>
          </div>
          <h1>{article.title}</h1>
          <p className="article-summary">{article.summary}</p>
          <div className="article-detail-row">
            <span className={`status-pill status-pill-${articleState}`}>{getArticleStatusLabel(articleState)}</span>
            <span>公開 {formatJapaneseDate(article.publishedAt)}</span>
            <span>更新 {formatJapaneseDate(article.updatedAt ?? article.publishedAt)}</span>
            <span>{article.readingTimeMinutes}分</span>
            <Link href="/articles">記事一覧へ</Link>
          </div>
          <div className="tag-row">
            {article.tags.map((tag) => (
              <Link key={tag} href={tagPath(tag)} className="tag-pill">
                {tag}
              </Link>
            ))}
          </div>
        </header>

        {headings.length > 0 ? (
          <aside className="outline-shell">
            <div className="section-kicker">Contents</div>
            <h2>目次</h2>
            <nav className="outline-list">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={heading.depth === 3 ? "outline-link outline-link-nested" : "outline-link"}
                >
                  {heading.title}
                </a>
              ))}
            </nav>
          </aside>
        ) : null}

        <section className="article-body">
          <MDXRemote
            source={article.body}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug],
              },
            }}
          />
        </section>
      </article>

      <RelatedArticles articles={related} />

      <ChatWidget
        title="この記事について質問する"
        description={`${siteConfig.name} の公開記事だけを対象に、このページの内容を中心に確認できます。`}
        articles={allArticles}
        initialArticleSlug={article.slug}
        lockArticle
        mode="floating"
        floatingLabel="質問"
      />
    </div>
  );
}
