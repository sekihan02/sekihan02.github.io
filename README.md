# 道草ログ

道草ログは、実装を読み解きながら技術的な仕組みを丁寧にまとめていく個人ブログです。ZIP、OCR、バイナリ解析、実装読解のような題材を、記事として蓄積していくことを目的にしています。

公開サイト:

- https://sekihan02.github.io/

## このリポジトリについて

このリポジトリは、公開中の道草ログのソースコードと記事データを管理するためのものです。サイト本体は静的に生成され、GitHub Pages で配信されます。

主な構成:

- `apps/site`: ブログ本体の Next.js アプリケーション
- `apps/agent-vercel`: 記事検索とチャット用の小さな Python API
- `content/articles`: 記事データ
- `content/generated`: サイト表示に使う生成済みデータ
- `scripts/content`: 記事データの生成スクリプト
- `tests`: サイトと補助機能のテスト

## ローカルで確認する

前提:

- Node.js 22 以上

セットアップ:

```bash
npm install
npm run dev
```

開発サーバー:

- http://127.0.0.1:3000

任意機能:

- ローカル LLM を使う場合は、別途 `apps/agent-vercel` の API を起動して接続できます

## よく使うコマンド

```bash
npm run content:build
npm run typecheck
npm run test
npm run build:pages
npm run dev:agent
```

## ローカル LLM チャット

このサイトのチャット UI は、任意でローカル API に接続できます。Ollama とローカルモデルを使う前提で、記事検索結果を根拠にしながら回答する構成です。

基本手順:

1. `apps/agent-vercel/.env.example` を参考に `apps/agent-vercel/.env.local` を作成する
2. Ollama で使いたいモデルを用意する
3. `npm run dev:agent` でローカル API を起動する
4. サイトのチャット画面で API URL を保存する

推奨モデル:

- `Qwen3.5:latest`: 回答品質を優先する場合
- `qwen3:4b`: 軽さを優先する場合

既定のローカル API URL:

- http://127.0.0.1:8787

## 記事の追加

記事は `content/articles` に追加します。記事データを更新したあとに `main` へ push すると、GitHub Pages 用のビルドと公開が自動で実行されます。

## デプロイ

GitHub Actions で静的サイトをビルドし、その成果物を GitHub Pages に公開しています。公開先は次の URL です。

- https://sekihan02.github.io/
