# 道草ログ

`道草ログ` は、MDX 記事と記事内チャットを組み合わせた日本語の技術ブログです。
公開サイトは `GitHub Pages`、チャット API は `Vercel` を前提にしています。

## 構成

```text
apps/
  site/           Next.js の静的サイト
  agent-vercel/   Vercel 用 Python API
content/
  articles/       記事の MDX
  generated/      記事 manifest / 検索インデックス
scripts/
  content/        manifest 生成
tests/
  site/           Node テスト
  agent/          Python テスト
```

## ローカル開発

1. `npm install`
2. 必要なら `.env.example` を `.env.local` にコピーして調整する
3. サイトを起動する: `npm run dev:site`
4. API を起動する: `npm run dev:agent`

ローカル確認 URL:

- サイト: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:8787`

## よく使うコマンド

- `npm run content:build`
- `npm run typecheck`
- `npm run test`
- `npm run build:pages`
- `powershell -ExecutionPolicy Bypass -File .\scripts\new-article.ps1 -Title "記事タイトル" -Slug "article-slug" -Category "ZIP" -Tags ZIP,Deflate`

## GitHub Pages

`.github/workflows/deploy-pages.yml` が `main` への push で静的ビルドし、`apps/site/out` を GitHub Pages へ配備します。

GitHub repository variables:

- `NEXT_PUBLIC_AGENT_API_URL`: Vercel の本番 URL
- `GOOGLE_SITE_VERIFICATION`: Search Console の HTML タグ用 verification code

公開 URL は `https://sekihan02.github.io/` です。

## Vercel

Vercel project は同じ GitHub repo を使い、root directory を `apps/agent-vercel` に設定します。

Vercel environment variables:

- `SITE_NAME=道草ログ`
- `ALLOWED_ORIGINS=https://sekihan02.github.io,http://127.0.0.1:3000`
- `SITE_DATA_BASE_URL=https://sekihan02.github.io`
- `FALLBACK_INDEX_URL=https://sekihan02.github.io/data/search-index.json`
- `MAX_REQUEST_BYTES=16384`
- `MAX_QUESTION_CHARS=500`

エンドポイント:

- `/healthz`
- `/v1/search`
- `/v1/chat`

## Search Console

公開後は `https://sekihan02.github.io/` を Search Console に追加し、`https://sekihan02.github.io/sitemap.xml` を送信します。
代表ページは URL Inspection から再クロール依頼してください。

