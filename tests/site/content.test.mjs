import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchIndex, computeRelatedArticles, stripMdx } from "../../scripts/content/lib.mjs";

test("stripMdx removes markdown-only syntax while keeping readable text", () => {
  const source = [
    "# Heading",
    "",
    "A [link](https://example.com) and `code`.",
    "",
    "```ts",
    "const value = 1;",
    "```"
  ].join("\n");

  const output = stripMdx(source);
  assert.match(output, /Heading/);
  assert.match(output, /link/);
  assert.doesNotMatch(output, /https:\/\/example.com/);
  assert.doesNotMatch(output, /const value/);
});

test("computeRelatedArticles mixes tag overlap and semantic similarity", () => {
  const articles = [
    {
      slug: "alpha",
      title: "Alpha",
      url: "/articles/alpha/",
      category: "Agent設計",
      tags: ["Agent", "RAG"]
    },
    {
      slug: "beta",
      title: "Beta",
      url: "/articles/beta/",
      category: "Cloudflare",
      tags: ["Agent", "Cloudflare"]
    },
    {
      slug: "gamma",
      title: "Gamma",
      url: "/articles/gamma/",
      category: "Cloudflare",
      tags: ["Next.js"]
    }
  ];

  const embeddings = new Map([
    ["alpha", [1, 0]],
    ["beta", [0.9, 0.1]],
    ["gamma", [0.1, 0.9]]
  ]);

  const related = computeRelatedArticles(articles, embeddings);
  assert.equal(related.alpha[0].slug, "beta");
  assert.match(related.alpha[0].reasons.join(" "), /タグ一致: Agent/);
  assert.match(related.alpha[0].reasons.join(" "), /内容が近い/);
});

test("buildSearchIndex preserves chunks and article metadata", () => {
  const index = buildSearchIndex([
    {
      slug: "alpha",
      title: "Alpha",
      summary: "summary",
      url: "/articles/alpha/",
      category: "Agent設計",
      tags: ["Agent"],
      publishedAt: "2026-03-01",
      plainText: "Alpha body",
      chunks: [{ id: "alpha-1", heading: "本文", text: "Alpha body" }]
    }
  ]);

  assert.equal(index.articles[0].slug, "alpha");
  assert.equal(index.articles[0].chunks[0].heading, "本文");
});
