function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeSitePath(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  const hasFileExtension = /\.[a-z0-9]+$/i.test(pathname);
  if (pathname.endsWith("/") || hasFileExtension) {
    return pathname;
  }

  return `${pathname}/`;
}

export const siteConfig = {
  name: "道草ログ",
  description: "記事を読みながら、その内容を検索ベースのチャットで確かめられる技術ブログ。",
  siteUrl: ensureTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sekihan02.github.io"),
};

export function toAbsoluteUrl(pathname: string) {
  return new URL(normalizeSitePath(pathname), siteConfig.siteUrl).toString();
}

export function toCanonicalPath(pathname: string) {
  return normalizeSitePath(pathname);
}

export function formatJapaneseDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function formatJapaneseMonth(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
  }).format(new Date(`${value}-01`));
}
