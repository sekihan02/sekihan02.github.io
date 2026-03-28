import type { Metadata } from "next";
import { ChatWidget } from "@/components/chat-widget";
import { getAllArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "チャット",
  description: "道草ログ内の記事を横断して質問できます。",
  alternates: {
    canonical: "/chat/"
  }
};

export default async function ChatPage() {
  const articles = await getAllArticles();

  return (
    <div className="page-stack">
      <ChatWidget
        title="道草ログ内の記事について質問する"
        description="利用可能な記事をもとに回答します。必要なら参考にしたい記事を選んでから質問できます。"
        articles={articles}
        agentBaseUrl={siteConfig.agentApiUrl}
      />
    </div>
  );
}
