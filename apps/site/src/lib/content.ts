import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { formatJapaneseMonth } from "@/lib/site";
import type {
  ArticleDocument,
  ArticleSummary,
  CategoryCollection,
  RelatedArticle,
  SearchIndexEntry,
  UpdateCalendarDay,
  UpdateCalendarMonth,
  UpdateEntry
} from "@/lib/types";

type ArticlesManifest = {
  generatedAt: string;
  site: {
    title: string;
    description: string;
  };
  articles: ArticleSummary[];
};

type RelatedManifest = {
  generatedAt: string;
  related: Record<string, RelatedArticle[]>;
};

type SearchIndexManifest = {
  generatedAt: string;
  articles: SearchIndexEntry[];
};

const repoRoot = path.resolve(process.cwd(), "..", "..");
const contentDir = path.join(repoRoot, "content", "articles");
const generatedDir = path.join(repoRoot, "content", "generated");

export function isDraftPreviewEnabled() {
  return process.env.MICHIKUSA_PREVIEW_DRAFTS === "1";
}

function articleActivityDate(article: ArticleSummary) {
  return article.updatedAt ?? article.publishedAt;
}

function compareArticlesByActivity(left: ArticleSummary, right: ArticleSummary) {
  const dateCompare = articleActivityDate(right).localeCompare(articleActivityDate(left));
  if (dateCompare !== 0) {
    return dateCompare;
  }

  const publishedCompare = right.publishedAt.localeCompare(left.publishedAt);
  if (publishedCompare !== 0) {
    return publishedCompare;
  }

  return left.slug.localeCompare(right.slug);
}

function compareUpdatesByDate(left: UpdateEntry, right: UpdateEntry) {
  const dateCompare = right.date.localeCompare(left.date);
  if (dateCompare !== 0) {
    return dateCompare;
  }

  const kindOrder = {
    updated: 0,
    published: 1,
    draft: 2
  } satisfies Record<UpdateEntry["kind"], number>;
  const kindCompare = kindOrder[left.kind] - kindOrder[right.kind];
  if (kindCompare !== 0) {
    return kindCompare;
  }

  return compareArticlesByActivity(left.article, right.article);
}

function compareCategories(left: CategoryCollection, right: CategoryCollection) {
  const leftDate = left.latestDate ?? "";
  const rightDate = right.latestDate ?? "";
  const dateCompare = rightDate.localeCompare(leftDate);
  if (dateCompare !== 0) {
    return dateCompare;
  }

  const countCompare = right.articleCount - left.articleCount;
  if (countCompare !== 0) {
    return countCompare;
  }

  return left.category.localeCompare(right.category, "ja");
}

function filterVisibleArticles(articles: ArticleSummary[]) {
  const visible = isDraftPreviewEnabled() ? articles : articles.filter((article) => !article.draft);
  return visible.sort(compareArticlesByActivity);
}

function buildUpdateEntries(articles: ArticleSummary[]): UpdateEntry[] {
  return articles
    .flatMap<UpdateEntry>((article) => {
      if (article.draft) {
        return [
          {
            date: articleActivityDate(article),
            kind: "draft",
            article
          }
        ];
      }

      const entries: UpdateEntry[] = [
        {
          date: article.publishedAt,
          kind: "published",
          article
        }
      ];

      if (article.updatedAt && article.updatedAt > article.publishedAt) {
        entries.push({
          date: article.updatedAt,
          kind: "updated",
          article
        });
      }

      return entries;
    })
    .sort(compareUpdatesByDate);
}

function startOfMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function buildCalendarMonth(monthKey: string, entries: UpdateEntry[]): UpdateCalendarMonth {
  const firstDay = startOfMonth(monthKey);
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = firstDay.getUTCDay();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const todayKey = new Date().toISOString().slice(0, 10);
  const entryMap = new Map<string, UpdateEntry[]>();

  for (const entry of entries) {
    if (!entry.date.startsWith(monthKey)) {
      continue;
    }

    if (!entryMap.has(entry.date)) {
      entryMap.set(entry.date, []);
    }
    entryMap.get(entry.date)?.push(entry);
  }

  const calendarStart = new Date(Date.UTC(year, month - 1, 1 - firstWeekday));
  const days: UpdateCalendarDay[] = [];

  for (let index = 0; index < totalCells; index += 1) {
    const current = new Date(calendarStart);
    current.setUTCDate(calendarStart.getUTCDate() + index);
    const date = current.toISOString().slice(0, 10);
    const dayEntries = entryMap.get(date) ?? [];

    days.push({
      date,
      dayNumber: current.getUTCDate(),
      inMonth: date.startsWith(monthKey),
      isToday: date === todayKey,
      updateCount: dayEntries.length,
      entries: dayEntries
    });
  }

  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  const totalUpdates = days.reduce((count, day) => (day.inMonth ? count + day.updateCount : count), 0);

  return {
    key: monthKey,
    label: formatJapaneseMonth(monthKey),
    totalUpdates,
    weeks
  };
}

async function readJson<T>(fileName: string) {
  const filePath = path.join(generatedDir, fileName);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function getArticlesManifest() {
  const manifest = await readJson<ArticlesManifest>("articles-manifest.json");

  return {
    ...manifest,
    articles: filterVisibleArticles(manifest.articles)
  };
}

export async function getRelatedManifest() {
  const manifest = await readJson<RelatedManifest>("related-manifest.json");
  if (isDraftPreviewEnabled()) {
    return manifest;
  }

  const visibleSlugs = new Set((await getArticlesManifest()).articles.map((article) => article.slug));
  const related = Object.fromEntries(
    Object.entries(manifest.related)
      .filter(([slug]) => visibleSlugs.has(slug))
      .map(([slug, items]) => [slug, items.filter((item) => visibleSlugs.has(item.slug))])
  );

  return {
    ...manifest,
    related
  };
}

export async function getSearchIndexManifest() {
  const manifest = await readJson<SearchIndexManifest>("search-index.json");
  if (isDraftPreviewEnabled()) {
    return manifest;
  }

  const visibleSlugs = new Set((await getArticlesManifest()).articles.map((article) => article.slug));

  return {
    ...manifest,
    articles: manifest.articles.filter((article) => visibleSlugs.has(article.slug))
  };
}

export async function getAllArticles() {
  const manifest = await getArticlesManifest();
  return manifest.articles;
}

export async function getArticleSlugs() {
  return (await getAllArticles()).map((article) => article.slug);
}

export async function getAllTags() {
  const tags = new Set<string>();
  for (const article of await getAllArticles()) {
    for (const tag of article.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort((left, right) => left.localeCompare(right, "ja"));
}

export async function getAllCategories() {
  const categories = new Set<string>();
  for (const article of await getAllArticles()) {
    categories.add(article.category);
  }
  return Array.from(categories).sort((left, right) => left.localeCompare(right, "ja"));
}

export async function getCategoryCollections(previewLimit = 3) {
  const grouped = new Map<string, ArticleSummary[]>();

  for (const article of await getAllArticles()) {
    if (!grouped.has(article.category)) {
      grouped.set(article.category, []);
    }

    grouped.get(article.category)?.push(article);
  }

  return Array.from(grouped.entries())
    .map<CategoryCollection>(([category, articles]) => ({
      category,
      articleCount: articles.length,
      latestDate: articles[0] ? articleActivityDate(articles[0]) : null,
      latestArticle: articles[0] ?? null,
      previewArticles: articles.slice(0, Math.max(1, previewLimit))
    }))
    .sort(compareCategories);
}

export async function getArticlesByTag(tag: string) {
  return (await getAllArticles()).filter((article) => article.tags.includes(tag));
}

export async function getArticlesByCategory(category: string) {
  return (await getAllArticles()).filter((article) => article.category === category);
}

export async function getArticleBySlug(slug: string): Promise<ArticleDocument | null> {
  const filePath = path.join(contentDir, `${slug}.mdx`);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    const summary = (await getAllArticles()).find((article) => article.slug === slug);
    if (!summary) {
      return null;
    }

    return {
      ...summary,
      body: parsed.content.trim()
    };
  } catch {
    return null;
  }
}

export async function getRelatedArticles(slug: string) {
  const manifest = await getRelatedManifest();
  const visibleSlugs = new Set((await getAllArticles()).map((article) => article.slug));
  return (manifest.related[slug] ?? []).filter((article) => visibleSlugs.has(article.slug));
}

export async function getUpdateEntries(limit = 8): Promise<UpdateEntry[]> {
  return buildUpdateEntries(await getAllArticles()).slice(0, limit);
}

export async function getUpdateCalendar(monthLimit = 2) {
  const entries = buildUpdateEntries(await getAllArticles());
  const monthKeys = Array.from(new Set(entries.map((entry) => entry.date.slice(0, 7))))
    .sort((left, right) => right.localeCompare(left))
    .slice(0, Math.max(1, monthLimit));

  if (monthKeys.length === 0) {
    monthKeys.push(new Date().toISOString().slice(0, 7));
  }

  return monthKeys.map((monthKey) => buildCalendarMonth(monthKey, entries));
}

export async function getHomeCollections() {
  const articles = await getAllArticles();
  const categoryCollections = await getCategoryCollections(3);

  return {
    latest: articles.slice(0, 3),
    categoryCollections,
    calendarMonths: await getUpdateCalendar(6)
  };
}
