export type ArticleFrontmatter = {
  title: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  summary: string;
  category: string;
  tags: string[];
  draft?: boolean;
  coverImage?: string | null;
};

export type ArticleSummary = {
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  draft?: boolean;
  url: string;
  readingTimeMinutes: number;
};

export type ArticleStatus = "draft" | "published" | "updated";

export type RelatedArticle = {
  slug: string;
  title: string;
  url: string;
  score: number;
  reasons: string[];
};

export type SearchIndexChunk = {
  id: string;
  heading: string;
  text: string;
};

export type SearchIndexEntry = {
  slug: string;
  title: string;
  summary: string;
  url: string;
  category: string;
  tags: string[];
  publishedAt: string;
  content: string;
  chunks: SearchIndexChunk[];
};

export type ArticleDocument = ArticleSummary & {
  body: string;
};

export type CategoryCollection = {
  category: string;
  articleCount: number;
  latestDate: string | null;
  latestArticle: ArticleSummary | null;
  previewArticles: ArticleSummary[];
};

export type UpdateEntry = {
  date: string;
  kind: ArticleStatus;
  article: ArticleSummary;
};

export type UpdateCalendarDay = {
  date: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  updateCount: number;
  entries: UpdateEntry[];
};

export type UpdateCalendarMonth = {
  key: string;
  label: string;
  totalUpdates: number;
  weeks: UpdateCalendarDay[][];
};
