export type AppLang = 'ru' | 'en';

const URL_BASE = 'https://eduardgagite.github.io';

export function isSupportedLang(value: string | null | undefined): value is AppLang {
  return value === 'ru' || value === 'en';
}

export function normalizeLang(value: string | null | undefined, fallback: AppLang = 'ru'): AppLang {
  return isSupportedLang(value) ? value : fallback;
}

export function withLang(path: string, lang: AppLang): string {
  const url = new URL(path, URL_BASE);
  url.searchParams.set('lang', lang);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function absoluteWithLang(path: string, lang: AppLang): string {
  const url = new URL(path, URL_BASE);
  url.searchParams.set('lang', lang);
  return url.toString();
}
