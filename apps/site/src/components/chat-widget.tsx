"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { ArticleSummary } from "@/lib/types";

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
    content: payload.answer ?? payload.message ?? "回答を作れませんでした。言い換えてもう一度試してください。",
    citations: uniqueCitations(payload.citations),
    related: uniqueRelated(payload.related)
  };
}

async function parseChatPayload(response: Response, agentBaseUrl: string): Promise<ChatResponse & { error?: string }> {
  const raw = await response.text();

  if (!raw) {
    if (response.ok) {
      throw new Error("チャットAPIから空の応答が返されました。API URL設定を確認してください。");
    }

    return {
      mode: "error",
      error: `チャットAPIエラー (HTTP ${response.status})`
    };
  }

  try {
    return JSON.parse(raw) as ChatResponse & { error?: string };
  } catch {
    throw new Error(`チャットAPIがJSONを返しませんでした。API URLを確認してください: ${agentBaseUrl}`);
  }
}

export function ChatWidget({
  title = "記事について質問する",
  description = "利用可能な記事をもとに回答します。",
  articles,
  initialArticleSlug,
  lockArticle = false,
  agentBaseUrl,
  mode = "inline",
  floatingLabel = "質問"
}: Props) {
  const chatReady = agentBaseUrl.trim().length > 0;
  const [question, setQuestion] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(initialArticleSlug ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: chatReady
        ? "気になる点を入力してください。利用可能な記事をもとに回答します。"
        : "現在チャットは準備中です。Vercel API の URL を設定すると利用できます。"
    }
  ]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(mode === "inline");
  const logRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (mode === "inline") {
      setIsOpen(true);
    }
  }, [mode]);

  useEffect(() => {
    if (!isOpen || !logRef.current) {
      return;
    }

    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, isOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chatReady) {
      setError("チャット API URL が未設定です。");
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
        content: currentQuestion
      }
    ]);

    try {
      const response = await fetch(`${agentBaseUrl.replace(/\/$/, "")}/v1/chat`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          question: currentQuestion,
          articleSlug
        })
      });

      const payload = await parseChatPayload(response, agentBaseUrl);
      if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "チャットの送信に失敗しました。");
      }

      startTransition(() => {
        setMessages((current) => [...current, buildAssistantMessage(payload)]);
      });

      if (mode === "floating") {
        setIsOpen(true);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "チャットの送信に失敗しました。";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content: message
        }
      ]);
    } finally {
      setIsPending(false);
    }
  }

  function handleQuestionKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
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
          <span>参考にする記事</span>
          <select value={selectedArticle} onChange={(event) => setSelectedArticle(event.target.value)}>
            <option value="">記事を選択する</option>
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
                    <strong>関連記事</strong>
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
            placeholder={chatReady ? "気になる点をそのまま入力してください" : "API の設定後に利用できます"}
            maxLength={500}
            disabled={!chatReady || isPending}
          />
        </label>

        {!chatReady ? <p className="helper-text">`NEXT_PUBLIC_AGENT_API_URL` を設定すると有効になります。</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={!chatReady || isPending}>
          {isPending ? "送信中..." : "質問する"}
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
