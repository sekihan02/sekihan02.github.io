import type { Metadata } from "next";
import { ChatWidget } from "@/components/chat-widget";
import { getAllArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "チャット",
  description: "道草ログの記事内容を、その場で絞り込みながら確認できます。",
  alternates: {
    canonical: "/chat/",
  },
};

export default async function ChatPage() {
  const articles = await getAllArticles();

  return (
    <div className="page-stack">
      <ChatWidget
        title="道草ログの記事について質問する"
        description="公開中の記事だけを対象に、その場で内容を絞り込んで確認できます。"
        articles={articles}
      />
    </div>
  );
}
