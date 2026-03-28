# 道草ログ

道草ログは、実装を読み解きながら技術的な仕組みを丁寧にまとめていく個人ブログです。ZIP、OCR、バイナリ解析、実装読解のような題材を、記事として蓄積していくことを目的にしています。

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

セットアップ:

```bash
npm install
npm run dev
```

開発サーバー:

- http://127.0.0.1:3000

## よく使うコマンド

```bash
npm run content:build
npm run typecheck
npm run test
npm run build:pages
```

## 記事の追加

記事は `content/articles` に追加します。記事データを更新したあとに `main` へ push すると、GitHub Pages 用のビルドと公開が自動で実行されます。

## デプロイ

GitHub Actions で静的サイトをビルドし、その成果物を GitHub Pages に公開しています。公開先は次の URL です。

- https://sekihan02.github.io/
