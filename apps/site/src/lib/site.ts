function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function ensureAbsoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
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

function resolveSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) {
    return ensureTrailingSlash(ensureAbsoluteUrl(configuredSiteUrl));
  }

  const cloudflarePagesUrl = process.env.CF_PAGES_URL?.trim();
  if (cloudflarePagesUrl) {
    return ensureTrailingSlash(ensureAbsoluteUrl(cloudflarePagesUrl));
  }

  return "https://michikusa-log-aji.pages.dev/";
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (!value) {
    return defaultValue;
  }

  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

export const siteConfig = {
  name: "道草ログ",
  description: "記事を読みながら、その内容を検索ベースのチャットで確かめられる技術ブログ。",
  siteUrl: resolveSiteUrl(),
  isIndexable: parseBooleanFlag(process.env.SITE_INDEXABLE, true),
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
