import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const repoRoot = path.resolve(__dirname, "..", "..");
export const contentDir = path.join(repoRoot, "content", "articles");
export const generatedDir = path.join(repoRoot, "content", "generated");
export const exportDir = path.join(repoRoot, "content", "exports", "ai-search");

const CATEGORY_WEIGHT = 0.25;
const TAG_WEIGHT = 0.3;
const EMBEDDING_WEIGHT = 0.45;
const EMBEDDING_MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

let embeddingPipelinePromise;

function isDraftPreviewEnabled() {
  return process.env.MICHIKUSA_PREVIEW_DRAFTS === "1";
}

function normalizeWhitespace(value) {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function stripMdx(value) {
  return normalizeWhitespace(
    value
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]+`/g, " ")
      .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/[*_~>-]/g, " ")
  );
}

function estimateReadingTime(text) {
  const words = stripMdx(text).replace(/\s+/g, "").length;
  return Math.max(1, Math.round(words / 280));
}

export function slugifyFilename(filename) {
  return filename.replace(/\.mdx?$/i, "");
}

function validateFrontmatter(data, filePath) {
  const requiredStrings = ["title", "slug", "summary", "category"];
  for (const key of requiredStrings) {
    if (typeof data[key] !== "string" || data[key].trim().length === 0) {
      throw new Error(`Missing or invalid "${key}" in ${filePath}`);
    }
  }

  if (typeof normalizeDateValue(data.publishedAt) !== "string") {
    throw new Error(`Missing or invalid "publishedAt" in ${filePath}`);
  }

  if (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== "string" || tag.trim().length === 0)) {
    throw new Error(`Missing or invalid "tags" in ${filePath}`);
  }

  if (data.updatedAt != null && typeof data.updatedAt !== "string") {
    const normalized = normalizeDateValue(data.updatedAt);
    if (typeof normalized !== "string") {
      throw new Error(`Invalid "updatedAt" in ${filePath}`);
    }
  }

  if (data.coverImage != null && typeof data.coverImage !== "string") {
    throw new Error(`Invalid "coverImage" in ${filePath}`);
  }

  if (data.draft != null && typeof data.draft !== "boolean") {
    throw new Error(`Invalid "draft" in ${filePath}`);
  }
}

function normalizeDateValue(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.slice(0, 10);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return null;
}

function buildChunks(body) {
  const sections = [];
  const lines = body.split("\n");
  let heading = "本文";
  let buffer = [];

  const flush = () => {
    const text = stripMdx(buffer.join("\n"));
    if (text.length > 0) {
      sections.push({ heading, text });
    }
    buffer = [];
  };

  for (const line of lines) {
    const match = /^##+\s+(.*)$/.exec(line);
    if (match) {
      flush();
      heading = match[1].trim();
      continue;
    }
    buffer.push(line);
  }

  flush();
  return sections.slice(0, 8);
}

export async function readArticles({ includeDrafts = isDraftPreviewEnabled() } = {}) {
  const files = (await fs.readdir(contentDir))
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
    .sort();
  const articles = [];

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    validateFrontmatter(parsed.data, filePath);
    const expectedSlug = slugifyFilename(file);
    if (parsed.data.slug !== expectedSlug) {
      throw new Error(`Slug "${parsed.data.slug}" in ${filePath} must match filename "${expectedSlug}.mdx"`);
    }

    const body = normalizeWhitespace(parsed.content);
    const plainText = stripMdx(body);
    const chunks = buildChunks(body).map((chunk, index) => ({
      id: `${parsed.data.slug}-${index + 1}`,
      heading: chunk.heading,
      text: chunk.text
    }));

    articles.push({
      title: parsed.data.title,
      slug: parsed.data.slug,
      publishedAt: normalizeDateValue(parsed.data.publishedAt),
      updatedAt: normalizeDateValue(parsed.data.updatedAt) ?? normalizeDateValue(parsed.data.publishedAt),
      summary: parsed.data.summary,
      category: parsed.data.category,
      tags: parsed.data.tags,
      draft: parsed.data.draft ?? false,
      coverImage: parsed.data.coverImage ?? null,
      url: `/articles/${parsed.data.slug}/`,
      body,
      plainText,
      readingTimeMinutes: estimateReadingTime(body),
      chunks
    });
  }

  return includeDrafts ? articles : articles.filter((article) => !article.draft);
}

async function getEmbeddingPipeline() {
  if (process.env.SKIP_EMBEDDINGS === "1") {
    return null;
  }

  if (!embeddingPipelinePromise) {
    embeddingPipelinePromise = import("@xenova/transformers")
      .then(async ({ env, pipeline }) => {
        env.allowLocalModels = true;
        return pipeline("feature-extraction", EMBEDDING_MODEL_ID);
      })
      .catch((error) => {
        console.warn(`[content] embeddings disabled: ${error.message}`);
        return null;
      });
  }

  return embeddingPipelinePromise;
}

function cosineSimilarity(left, right) {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

async function embedTextBatch(articles) {
  const extractor = await getEmbeddingPipeline();
  if (!extractor) {
    return new Map();
  }

  const embeddings = new Map();

  for (const article of articles) {
    const embedding = await extractor(`${article.title}\n${article.summary}\n${article.plainText}`, {
      pooling: "mean",
      normalize: true
    });

    embeddings.set(article.slug, Array.from(embedding.data));
  }

  return embeddings;
}

function tagOverlapScore(leftTags, rightTags) {
  const left = new Set(leftTags);
  const right = new Set(rightTags);
  let overlap = 0;

  for (const tag of left) {
    if (right.has(tag)) {
      overlap += 1;
    }
  }

  return left.size === 0 && right.size === 0 ? 0 : overlap / Math.max(left.size, right.size);
}

export function computeRelatedArticles(articles, embeddings = new Map()) {
  const related = {};

  for (const article of articles) {
    const candidates = articles
      .filter((candidate) => candidate.slug !== article.slug)
      .map((candidate) => {
        const categoryScore = article.category === candidate.category ? 1 : 0;
        const tagsScore = tagOverlapScore(article.tags, candidate.tags);
        const semanticScore =
          embeddings.has(article.slug) && embeddings.has(candidate.slug)
            ? cosineSimilarity(embeddings.get(article.slug), embeddings.get(candidate.slug))
            : 0;

        const score =
          categoryScore * CATEGORY_WEIGHT +
          tagsScore * TAG_WEIGHT +
          semanticScore * EMBEDDING_WEIGHT;

        const reasons = [];
        const sharedTags = article.tags.filter((tag) => candidate.tags.includes(tag));
        if (article.category === candidate.category) {
          reasons.push(`カテゴリ一致: ${article.category}`);
        }
        if (sharedTags.length > 0) {
          reasons.push(`タグ一致: ${sharedTags[0]}`);
        }
        if (semanticScore > 0.2) {
          reasons.push("内容が近い");
        }

        return {
          slug: candidate.slug,
          title: candidate.title,
          url: candidate.url,
          score: Number(score.toFixed(4)),
          reasons: reasons.length > 0 ? reasons : ["関連度スコア"]
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);

    related[article.slug] = candidates;
  }

  return related;
}

export function buildSearchIndex(articles) {
  return {
    generatedAt: new Date().toISOString(),
    articles: articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      url: article.url,
      category: article.category,
      tags: article.tags,
      publishedAt: article.publishedAt,
      content: article.plainText,
      chunks: article.chunks
    }))
  };
}

export function buildArticlesManifest(articles) {
  return {
    generatedAt: new Date().toISOString(),
    site: {
      title: "道草ログ",
      description: "記事を読みながら、その内容をチャットで確かめられる技術サイト。"
    },
    articles: articles
      .slice()
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
      .map((article) => ({
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        category: article.category,
        tags: article.tags,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        draft: article.draft,
        url: article.url,
        readingTimeMinutes: article.readingTimeMinutes
      }))
  };
}

export function buildRelatedManifest(related) {
  return {
    generatedAt: new Date().toISOString(),
    related
  };
}

export async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
}

export async function writeJson(filePath, value) {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export async function buildAllContent({ includeDrafts = isDraftPreviewEnabled() } = {}) {
  const articles = await readArticles({ includeDrafts });
  const embeddings = await embedTextBatch(articles);
  const related = computeRelatedArticles(articles, embeddings);
  const articlesManifest = buildArticlesManifest(articles);
  const relatedManifest = buildRelatedManifest(related);
  const searchIndex = buildSearchIndex(articles);

  await writeJson(path.join(generatedDir, "articles-manifest.json"), articlesManifest);
  await writeJson(path.join(generatedDir, "related-manifest.json"), relatedManifest);
  await writeJson(path.join(generatedDir, "search-index.json"), searchIndex);

  return {
    articles,
    articlesManifest,
    relatedManifest,
    searchIndex
  };
}

export function toAiSearchDocument(article) {
  const header = [
    `Title: ${article.title}`,
    `Slug: ${article.slug}`,
    `Category: ${article.category}`,
    `Tags: ${article.tags.join(", ")}`,
    `Published At: ${article.publishedAt}`,
    `URL: ${article.url}`,
    "",
    article.summary,
    "",
    article.plainText
  ];

  return header.join("\n");
}
