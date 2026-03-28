import { buildAllContent } from "./lib.mjs";

const result = await buildAllContent();

console.log(
  `[content] generated ${result.articlesManifest.articles.length} articles, ${Object.keys(result.relatedManifest.related).length} related groups`
);
