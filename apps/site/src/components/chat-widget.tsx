"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { ArticleSummary } from "@/lib/types";

const LOCAL_AGENT_API_STORAGE_KEY = "michikusa-log.agent-api-url";
const DEFAULT_LOCAL_AGENT_API_URL = "http://127.0.0.1:8787";

type Citation = {
  slug: string;
  title: string;
  url: string;
  excerpt: string;
};

type RelatedLink = {
  slug: string;
  title: string;
  url: string;
};

type ChatResponse = {
  mode: string;
  answer?: string;
  message?: string;
  citations?: Citation[];
  related?: RelatedLink[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  related?: RelatedLink[];
};

type Props = {
  title?: string;
  description?: string;
  articles: ArticleSummary[];
  initialArticleSlug?: string;
  lockArticle?: boolean;
  agentBaseUrl: string;
  mode?: "inline" | "floating";
  floatingLabel?: string;
};

function normalizeAgentUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function readSavedAgentUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return normalizeAgentUrl(window.localStorage.getItem(LOCAL_AGENT_API_STORAGE_KEY) ?? "");
  } catch {
    return "";
  }
}

function persistAgentUrl(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(LOCAL_AGENT_API_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(LOCAL_AGENT_API_STORAGE_KEY);
    }
  } catch {
    return;
  }
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

function buildAssistantMessage(payload: ChatResponse): ChatMessage {
  return {
    id: `${Date.now()}-assistant`,
    role: "assistant",
    content: payload.answer ?? payload.message ?? "回答をまとめられませんでした。言い換えてもう一度試してください。",
    citations: uniqueCitations(payload.citations),
    related: uniqueRelated(payload.related),
  };
}

function buildIntroMessage(chatReady: boolean, agentUrl: string): ChatMessage {
  if (chatReady) {
    return {
      id: "intro",
      role: "assistant",
      content: `ローカル API に接続しました。記事の内容に沿って案内します。\n接続先: ${agentUrl}`,
    };
  }

  return {
    id: "intro",
    role: "assistant",
    content: `ローカル API URL を保存するとチャットが有効になります。\n既定値は ${DEFAULT_LOCAL_AGENT_API_URL} です。`,
  };
}

async function parseChatPayload(response: Response, agentBaseUrl: string): Promise<ChatResponse & { error?: string }> {
  const raw = await response.text();

  if (!raw) {
    if (response.ok) {
      throw new Error(`チャット API から空の応答が返されました。接続先を確認してください: ${agentBaseUrl}`);
    }

    return {
      mode: "error",
      error: `チャット API エラー (HTTP ${response.status})`,
    };
  }

  try {
    return JSON.parse(raw) as ChatResponse & { error?: string };
  } catch {
    throw new Error(`チャット API が JSON を返しませんでした。接続先を確認してください: ${agentBaseUrl}`);
  }
}

export function ChatWidget({
  title = "記事について質問する",
  description = "公開中の記事に沿って、気になる点をそのまま質問できます。",
  articles,
  initialArticleSlug,
  lockArticle = false,
  agentBaseUrl,
  mode = "inline",
  floatingLabel = "質問",
}: Props) {
  const defaultAgentBaseUrl = normalizeAgentUrl(agentBaseUrl);
  const [resolvedAgentBaseUrl, setResolvedAgentBaseUrl] = useState(defaultAgentBaseUrl);
  const [agentUrlInput, setAgentUrlInput] = useState(defaultAgentBaseUrl || DEFAULT_LOCAL_AGENT_API_URL);
  const [question, setQuestion] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(initialArticleSlug ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([buildIntroMessage(defaultAgentBaseUrl.length > 0, defaultAgentBaseUrl)]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(mode === "inline");
  const logRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const chatReady = resolvedAgentBaseUrl.length > 0;
  const usingSavedAgentUrl =
    resolvedAgentBaseUrl.length > 0 && resolvedAgentBaseUrl !== defaultAgentBaseUrl;
  const showConnectionSettings = mode === "inline" || !chatReady;

  useEffect(() => {
    if (mode === "inline") {
      setIsOpen(true);
    }
  }, [mode]);

  useEffect(() => {
    const savedAgentUrl = readSavedAgentUrl();
    const nextAgentUrl = savedAgentUrl || defaultAgentBaseUrl;
    setResolvedAgentBaseUrl(nextAgentUrl);
    setAgentUrlInput(nextAgentUrl || DEFAULT_LOCAL_AGENT_API_URL);
  }, [defaultAgentBaseUrl]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.id === "intro") {
        return [buildIntroMessage(chatReady, resolvedAgentBaseUrl)];
      }
      return current;
    });
  }, [chatReady, resolvedAgentBaseUrl]);

  useEffect(() => {
    if (!isOpen || !logRef.current) {
      return;
    }

    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, isOpen]);

  async function handleConnectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = normalizeAgentUrl(agentUrlInput);
    persistAgentUrl(normalized);
    setResolvedAgentBaseUrl(normalized || defaultAgentBaseUrl);
    setAgentUrlInput(normalized || defaultAgentBaseUrl || DEFAULT_LOCAL_AGENT_API_URL);
    setError("");
  }

  function handleClearConnection() {
    persistAgentUrl("");
    setResolvedAgentBaseUrl(defaultAgentBaseUrl);
    setAgentUrlInput(defaultAgentBaseUrl || DEFAULT_LOCAL_AGENT_API_URL);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chatReady) {
      setError("ローカル API URL を保存するとチャットを使えます。");
      return;
    }

    if (!question.trim() || isPending) {
      return;
    }

    const currentQuestion = question.trim();
    const articleSlug = lockArticle ? initialArticleSlug ?? "" : selectedArticle;

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

    try {
      const response = await fetch(`${resolvedAgentBaseUrl}/v1/chat`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestion,
          articleSlug,
        }),
      });

      const payload = await parseChatPayload(response, resolvedAgentBaseUrl);
      if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "チャットの応答に失敗しました。");
      }

      startTransition(() => {
        setMessages((current) => [...current, buildAssistantMessage(payload)]);
      });

      if (mode === "floating") {
        setIsOpen(true);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "チャットの応答に失敗しました。";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setIsPending(false);
    }
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

      {showConnectionSettings ? (
        <form className="chat-settings" onSubmit={handleConnectionSubmit}>
          <div>
            <div className="section-kicker">Local API</div>
            <p className="helper-text">
              {chatReady
                ? `現在の接続先: ${resolvedAgentBaseUrl}${usingSavedAgentUrl ? " (このブラウザに保存済み)" : ""}`
                : "GitHub Pages 上の UI から、あなたのローカル LLM API へ接続できます。"}
            </p>
          </div>

          <label className="search-field">
            <span>API URL</span>
            <input
              type="url"
              inputMode="url"
              value={agentUrlInput}
              onChange={(event) => setAgentUrlInput(event.target.value)}
              placeholder={DEFAULT_LOCAL_AGENT_API_URL}
            />
          </label>

          <div className="chat-settings-actions">
            <button type="submit" className="secondary-button">
              接続先を保存
            </button>
            <button type="button" className="secondary-button" onClick={handleClearConnection}>
              保存した設定を消す
            </button>
          </div>
        </form>
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
            placeholder={chatReady ? "気になる点をそのまま入力してください" : "ローカル API URL を保存すると利用できます"}
            maxLength={500}
            disabled={!chatReady || isPending}
          />
        </label>

        {!chatReady ? (
          <p className="helper-text">まずはローカル API を起動し、接続先 URL を保存してください。</p>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={!chatReady || isPending}>
          {isPending ? "回答中..." : "質問する"}
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
