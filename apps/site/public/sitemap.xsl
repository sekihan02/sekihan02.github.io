<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <title>道草ログ サイトマップ</title>
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
          table {
            width: 100%;
            margin-top: 24px;
            border-collapse: collapse;
            background: #fffdfa;
            border-radius: 18px;
            overflow: hidden;
          }
          th, td {
            padding: 16px 18px;
            text-align: left;
            border-bottom: 1px solid rgba(23, 32, 38, 0.08);
            vertical-align: top;
          }
          th {
            background: #edf1ec;
            font-size: 13px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          tr:last-child td {
            border-bottom: none;
          }
          a {
            color: #1f4f43;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
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
            <span class="eyebrow">SITEMAP</span>
            <h1>道草ログ サイトマップ</h1>
            <p>これは検索エンジンにサイト構造を伝えるための XML です。ブラウザで開いたときも確認しやすいように一覧表示しています。</p>
            <div class="meta">
              <span>URL数: <xsl:value-of select="count(s:urlset/s:url)" /></span>
              <span>形式: <code>XML Sitemap</code></span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>最終更新</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="s:urlset/s:url">
                  <tr>
                    <td>
                      <a>
                        <xsl:attribute name="href"><xsl:value-of select="s:loc" /></xsl:attribute>
                        <xsl:value-of select="s:loc" />
                      </a>
                    </td>
                    <td><xsl:value-of select="s:lastmod" /></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
