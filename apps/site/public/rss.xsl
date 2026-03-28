<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <title><xsl:value-of select="rss/channel/title" /> RSSフィード</title>
        <style>
          body {
            margin: 0;
            font-family: "IBM Plex Sans JP", "Hiragino Sans", sans-serif;
            background: linear-gradient(180deg, #f8f4e8 0%, #eef3ef 100%);
            color: #172026;
          }
          .shell {
            max-width: 960px;
            margin: 0 auto;
            padding: 48px 24px 80px;
          }
          .panel {
            background: rgba(255, 252, 246, 0.9);
            border: 1px solid rgba(23, 32, 38, 0.12);
            border-radius: 24px;
            padding: 28px;
            box-shadow: 0 18px 48px rgba(23, 32, 38, 0.08);
          }
          .eyebrow {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            background: #dfe9df;
            color: #31453c;
            font-size: 12px;
            letter-spacing: 0.08em;
          }
          h1 {
            margin: 16px 0 12px;
            font-size: 40px;
            line-height: 1.2;
          }
          p {
            line-height: 1.8;
          }
          .meta {
            margin-top: 18px;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            color: #5c6864;
            font-size: 14px;
          }
          .list {
            margin-top: 24px;
            display: grid;
            gap: 16px;
          }
          .item {
            display: block;
            background: #fffdfa;
            border: 1px solid rgba(23, 32, 38, 0.1);
            border-radius: 18px;
            padding: 20px;
            color: inherit;
            text-decoration: none;
          }
          .item:hover {
            border-color: rgba(52, 87, 73, 0.35);
            transform: translateY(-1px);
          }
          .item-title {
            display: block;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .item-date {
            display: block;
            color: #5c6864;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .item-description {
            display: block;
            line-height: 1.7;
          }
          code {
            padding: 0.15rem 0.4rem;
            background: #edf1ec;
            border-radius: 6px;
            font-family: "IBM Plex Mono", monospace;
          }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="panel">
            <span class="eyebrow">RSS FEED</span>
            <h1><xsl:value-of select="rss/channel/title" /></h1>
            <p><xsl:value-of select="rss/channel/description" /></p>
            <p>これは更新を購読するためのフィードです。通常の閲覧ページではなく、RSS リーダーや各種アプリが新着記事を取得するために使います。</p>
            <div class="meta">
              <span>配信URL: <code><xsl:value-of select="rss/channel/atom:link/@href" /></code></span>
              <span>最終更新: <xsl:value-of select="rss/channel/lastBuildDate" /></span>
              <span>記事数: <xsl:value-of select="count(rss/channel/item)" /></span>
            </div>
            <div class="list">
              <xsl:for-each select="rss/channel/item">
                <a class="item">
                  <xsl:attribute name="href"><xsl:value-of select="link" /></xsl:attribute>
                  <span class="item-title"><xsl:value-of select="title" /></span>
                  <span class="item-date"><xsl:value-of select="pubDate" /></span>
                  <span class="item-description"><xsl:value-of select="description" /></span>
                </a>
              </xsl:for-each>
            </div>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
