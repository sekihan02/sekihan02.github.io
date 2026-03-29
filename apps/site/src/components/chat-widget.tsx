"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { ArticleSummary, SearchIndexEntry } from "@/lib/types";

type Citation = {
  slug: string;
  title: string;
  url: string;
  excerpt: string;
  score: number;
};

type RelatedLink = {
  slug: string;
  title: string;
  url: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  related?: RelatedLink[];
};

type SearchIndexManifest = {
  generatedAt: string;
  articles: SearchIndexEntry[];
};

type RelatedManifest = {
  generatedAt: string;
  related: Record<string, RelatedLink[]>;
};

type Props = {
  title?: string;
  description?: string;
  articles: ArticleSummary[];
  initialArticleSlug?: string;
  lockArticle?: boolean;
  mode?: "inline" | "floating";
  floatingLabel?: string;
};

type ResourceState = "loading" | "ready" | "error";

function normalizeText(value: string) {
  const compact = Array.from(value.toLowerCase()).filter((char) => !/\s/u.test(char)).join("");
  return Array.from(compact)
    .filter((char) => /[a-z0-9]/i.test(char) || /[\u3040-\u30ff\u4e00-\u9fff]/u.test(char))
    .join("");
}

function charNgrams(value: string, size: number) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return new Set<string>();
  }

  if (normalized.length <= size) {
    return new Set([normalized]);
  }

  const grams = new Set<string>();
  for (let index = 0; index <= normalized.length - size; index += 1) {
    grams.add(normalized.slice(index, index + size));
  }
  return grams;
}

function overlapScore(query: string, text: string) {
  const queryGrams = new Set([...charNgrams(query, 2), ...charNgrams(query, 3)]);
  const textGrams = new Set([...charNgrams(text, 2), ...charNgrams(text, 3)]);
  if (!queryGrams.size || !textGrams.size) {
    return 0;
  }

  let overlap = 0;
  for (const gram of queryGrams) {
    if (textGrams.has(gram)) {
      overlap += 1;
    }
  }

  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);
  const containment = normalizedQuery && normalizedText.includes(normalizedQuery) ? 0.15 : 0;
  return overlap / Math.max(queryGrams.size, 1) + containment;
}

function cleanExcerpt(value: string, limit = 180) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= limit) {
    return compact;
  }
  return `${compact.slice(0, limit - 1).trimEnd()}…`;
}

function uniqueCitations(citations: Citation[] = []) {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    const key = `${citation.slug}::${citation.url}::${citation.excerpt}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function uniqueRelated(related: RelatedLink[] = []) {
  const seen = new Set<string>();
  return related.filter((article) => {
    const key = `${article.slug}::${article.url}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildIntroMessage(state: ResourceState, detail = ""): ChatMessage {
  if (state === "ready") {
    return {
      id: "intro",
      role: "assistant",
      content:
        "このチャットはブラウザ内で記事インデックスを検索して答えます。必要なら記事を選ぶと、回答対象を絞り込めます。",
    };
  }

  if (state === "error") {
    return {
      id: "intro",
      role: "assistant",
      content: detail || "記事データを読み込めませんでした。ページを再読み込みしてもう一度試してください。",
    };
  }

  return {
    id: "intro",
    role: "assistant",
    content: "記事データを読み込んでいます。準備ができると、そのまま質問できます。",
  };
}

function pickArticleContext(entries: SearchIndexEntry[], articleSlug?: string) {
  if (!articleSlug) {
    return null;
  }

  return entries.find((article) => article.slug === articleSlug) ?? null;
}

function combineQuery(question: string, articleContext: SearchIndexEntry | null) {
  if (!articleContext) {
    return question;
  }

  return [
    question,
    articleContext.title,
    articleContext.summary,
    articleContext.tags.join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}

function rankLocalHits(entries: SearchIndexEntry[], query: string, articleSlug?: string) {
  const results: Citation[] = [];

  for (const article of entries) {
    for (const chunk of article.chunks) {
      let score = overlapScore(query, `${article.title} ${chunk.heading} ${chunk.text}`);
      if (articleSlug && article.slug === articleSlug) {
        score += 0.2;
      }

      if (score <= 0) {
        continue;
      }

      results.push({
        slug: article.slug,
        title: article.title,
        url: article.url,
        excerpt: cleanExcerpt(chunk.text),
        score,
      });
    }
  }

  const deduped = new Map<string, Citation>();
  for (const result of results.sort((left, right) => right.score - left.score)) {
    const key = `${result.slug}::${result.excerpt}`;
    if (!deduped.has(key)) {
      deduped.set(key, result);
    }
  }

  return Array.from(deduped.values()).slice(0, 3);
}

function chooseRelated(relatedManifest: RelatedManifest | null, articleSlug: string, hits: Citation[]) {
  if (!relatedManifest) {
    return [];
  }

  if (articleSlug && relatedManifest.related[articleSlug]) {
    return uniqueRelated(relatedManifest.related[articleSlug]).slice(0, 3);
  }

  for (const hit of hits) {
    const related = relatedManifest.related[hit.slug];
    if (related?.length) {
      return uniqueRelated(related).slice(0, 3);
    }
  }

  return [];
}

function buildAnswer(question: string, hits: Citation[], articleContext: SearchIndexEntry | null) {
  if (!hits.length) {
    if (articleContext) {
      return `「${articleContext.title}」を中心に探しましたが、質問「${question}」に近い記述を見つけられませんでした。別の言い方で聞くか、記事を選ばずに試してみてください。`;
    }

    return `質問「${question}」に近い記述を見つけられませんでした。言い換えるか、対象の記事を選ぶと見つかりやすくなります。`;
  }

  const lead = articleContext
    ? `「${articleContext.title}」を中心に、質問「${question}」に近い記述を見つけました。`
    : `質問「${question}」に近い記述を見つけました。`;
  const bullets = hits.map((hit) => `- ${hit.title}: ${hit.excerpt}`);
  return [lead, ...bullets].join("\n");
}

async function loadJson<T>(path: string) {
  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`データの読み込みに失敗しました: ${path}`);
  }
  return (await response.json()) as T;
}

export function ChatWidget({
  title = "記事について質問する",
  description = "公開中の記事だけを対象に、内容を絞って確認できます。",
  articles,
  initialArticleSlug,
  lockArticle = false,
  mode = "inline",
  floatingLabel = "質問",
}: Props) {
  const [resourceState, setResourceState] = useState<ResourceState>("loading");
  const [resourceError, setResourceError] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchIndexManifest | null>(null);
  const [relatedManifest, setRelatedManifest] = useState<RelatedManifest | null>(null);
  const [question, setQuestion] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(initialArticleSlug ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([buildIntroMessage("loading")]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(mode === "inline");
  const logRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const chatReady = resourceState === "ready" && Boolean(searchIndex);

  useEffect(() => {
    if (mode === "inline") {
      setIsOpen(true);
    }
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function loadResources() {
      try {
        const [loadedSearchIndex, loadedRelatedManifest] = await Promise.all([
          loadJson<SearchIndexManifest>("/data/search-index.json"),
          loadJson<RelatedManifest>("/data/related.json"),
        ]);

        if (cancelled) {
          return;
        }

        setSearchIndex(loadedSearchIndex);
        setRelatedManifest(loadedRelatedManifest);
        setResourceState("ready");
        setResourceError("");
      } catch (caught) {
        if (cancelled) {
          return;
        }

        const message =
          caught instanceof Error
            ? caught.message
            : "記事データの読み込みに失敗しました。ページを再読み込みしてもう一度試してください。";
        setResourceState("error");
        setResourceError(message);
      }
    }

    loadResources();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.id === "intro") {
        return [buildIntroMessage(resourceState, resourceError)];
      }
      return current;
    });
  }, [resourceError, resourceState]);

  useEffect(() => {
    if (!isOpen || !logRef.current) {
      return;
    }

    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, isOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!chatReady || !searchIndex) {
      setError(
        resourceState === "error"
          ? resourceError || "記事データを読み込めていません。"
          : "まだ記事データを読み込み中です。少し待ってからもう一度試してください。",
      );
      return;
    }

    if (!question.trim() || isPending) {
      return;
    }

    const currentQuestion = question.trim();
    const articleSlug = lockArticle ? initialArticleSlug ?? "" : selectedArticle;
    const articleContext = pickArticleContext(searchIndex.articles, articleSlug);
    const expandedQuery = combineQuery(currentQuestion, articleContext);
    const hits = uniqueCitations(rankLocalHits(searchIndex.articles, expandedQuery, articleSlug));
    const related = chooseRelated(relatedManifest, articleSlug, hits);
    const answer = buildAnswer(currentQuestion, hits, articleContext);

    setError("");
    setQuestion("");
    setIsPending(true);
    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-user`,
        role: "user",
        content: currentQuestion,
      },
    ]);

    startTransition(() => {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: answer,
          citations: hits,
          related,
        },
      ]);
      setIsPending(false);
      if (mode === "floating") {
        setIsOpen(true);
      }
    });
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  const content = (
    <>
      {!lockArticle ? (
        <label className="select-field">
          <span>対象にする記事</span>
          <select value={selectedArticle} onChange={(event) => setSelectedArticle(event.target.value)}>
            <option value="">記事を選ばず質問する</option>
            {articles.map((article) => (
              <option key={article.slug} value={article.slug}>
                {article.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div ref={logRef} className="chat-log">
        {messages.map((message) => (
          <article key={message.id} className={`chat-bubble chat-bubble-${message.role}`}>
            <div className="chat-role">{message.role === "user" ? "You" : "道草ログ"}</div>
            <p>{message.content}</p>
            {message.citations && message.citations.length > 0 ? (
              <div className="citation-list">
                {message.citations.map((citation, index) => (
                  <a
                    key={`${message.id}-${citation.slug}-${citation.url}-${index}`}
                    href={citation.url}
                    className="citation-card"
                  >
                    <strong>{citation.title}</strong>
                    <span>{citation.excerpt}</span>
                  </a>
                ))}
              </div>
            ) : null}
            {message.related && message.related.length > 0 ? (
              <div className="citation-list">
                {message.related.map((related, index) => (
                  <a key={`${message.id}-${related.slug}-${index}`} href={related.url} className="citation-card">
                    <strong>関連する記事</strong>
                    <span>{related.title}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <form ref={formRef} className="chat-form" onSubmit={handleSubmit}>
        <label className="question-field">
          <span>質問</span>
          <textarea
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleQuestionKeyDown}
            placeholder={chatReady ? "気になる点をそのまま入力してください" : "記事データの準備ができると入力できます"}
            maxLength={500}
            disabled={!chatReady || isPending}
          />
        </label>

        {!chatReady ? <p className="helper-text">記事データの読み込み完了後にチャットを使えます。</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={!chatReady || isPending}>
          {isPending ? "検索中..." : "質問する"}
        </button>
      </form>
    </>
  );

  if (mode === "floating") {
    return (
      <div className="chat-floating">
        {isOpen ? (
          <section className="chat-shell chat-shell-floating">
            <div className="chat-shell-head">
              <div>
                <div className="section-kicker">Chat</div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
              <button
                type="button"
                className="chat-close-button"
                onClick={() => setIsOpen(false)}
                aria-label="チャットを閉じる"
              >
                ×
              </button>
            </div>
            {content}
          </section>
        ) : null}

        <button
          type="button"
          className="chat-fab"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "チャットを閉じる" : "チャットを開く"}
        >
          {isOpen ? "×" : floatingLabel}
        </button>
      </div>
    );
  }

  return (
    <section className="chat-shell">
      <div className="section-kicker">Chat</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {content}
    </section>
  );
}
