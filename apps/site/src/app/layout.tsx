import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/site";

const headingFont = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-heading"
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION
        }
      }
    : {}),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className={`${headingFont.variable} ${monoFont.variable}`}>
        <div className="site-background">
          <div className="site-shell">
            <header className="site-header">
              <Link href="/" className="brand-mark">
                <span className="brand-kicker">Michikusa Log</span>
                <strong>道草ログ</strong>
              </Link>
              <nav className="site-nav">
                <Link href="/articles/">記事一覧</Link>
                <Link href="/articles/michikusa-log-intro/">道草ログについて</Link>
                <Link href="/chat/">チャット</Link>
              </nav>
            </header>
            <main>{children}</main>
            <footer className="site-footer">
              <div className="site-footer-links">
                <Link href="/rss.xml" title="更新を購読するための RSS フィード">
                  RSSフィード
                </Link>
                <Link href="/sitemap.xml" title="検索エンジン向けのサイトマップ">
                  サイトマップ
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
