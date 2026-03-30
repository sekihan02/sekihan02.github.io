# 道草ログ

道草ログは、実装を読み解きながら技術的な仕組みを整理していく個人ブログです。ZIP、OCR、バイナリ解析、実装読解のような題材を、記事として積み上げていくことを目的にしています。

公開サイト:

- https://sekihan02.github.io/

## このリポジトリについて

このリポジトリは、公開中の道草ログのソースコードと記事データを管理するためのものです。サイト本体は静的に生成され、GitHub Pages で配信されます。

主な構成:

- `apps/site`: ブログ本体の Next.js アプリケーション
- `content/articles`: 記事データ
- `content/generated`: サイト表示に使う生成済みデータ
- `scripts/content`: 記事データの生成スクリプト
- `tests`: サイトと補助機能のテスト

## ローカルで確認する

前提:

- Node.js 22 以上

最短手順:

```bash
npm install
npm run dev
```

開発サーバー:

- http://127.0.0.1:3000

補足:

- `apps/site` の `build` / `dev` は毎回 `scripts/content/build-content.mjs` を先に実行するため、`content/articles` を編集したらそのまま `npm run dev` で確認できます
- 記事ページや一覧の見た目を確認するだけなら、別の API サーバーは不要です

ローカル用の環境変数を明示したい場合は、次の値を `.env.local` か `.env` に置いてください。

```text
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NEXT_PUBLIC_AGENT_API_URL=http://127.0.0.1:8787
GOOGLE_SITE_VERIFICATION=
MICHIKUSA_PREVIEW_DRAFTS=0
```

本番に近い静的出力を確認したい場合:

```bash
npm run build:pages
```

生成先:

- `apps/site/out`

このディレクトリを静的 HTTP サーバーで開けば、GitHub Pages に近い状態で確認できます。

## よく使うコマンド

```bash
npm run content:build
npm run typecheck
npm run test
npm run build:pages
```

## チャットについて

公開サイトのチャットは、ブラウザ内で `search-index.json` と `related.json` を読み込み、公開中の記事だけを対象に検索ベースで回答します。外部 API や別サーバーへの接続は不要です。

## 記事の追加

記事は `content/articles` に追加します。記事データを更新したあとに `main` へ push すると、GitHub Pages 用のビルドと公開が自動で実行されます。

## デプロイ

GitHub Actions で静的サイトをビルドし、その成果物を GitHub Pages に公開しています。公開先は次の URL です。

- https://sekihan02.github.io/
