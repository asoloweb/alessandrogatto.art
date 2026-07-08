export type SiteLocale = 'it' | 'en';

const EN_SLUG_MAP: Record<string, string> = {
  'chi-sono-filosofia': 'about-philosophy',
  riconoscimenti: 'awards',
  portfolio: 'portfolio',
  altro: 'other',
  eventi: 'events',
  contatti: 'contacts',
  collezione: 'collection',
  progetto: 'project',
  home: 'home',
  'privacy-policy': 'privacy-policy',
  'cookie-policy': 'cookie-policy',
};

const IT_SLUG_MAP = Object.fromEntries(
  Object.entries(EN_SLUG_MAP).map(([it, en]) => [en, it])
) as Record<string, string>;

export function getLocaleFromPath(pathname: string): SiteLocale {
  return pathname.startsWith('/en') ? 'en' : 'it';
}

export function withLocalePath(path: string, locale: SiteLocale) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'it') {
    if (cleanPath === '/en') return '/';
    return cleanPath.replace(/^\/en(?=\/|$)/, '') || '/';
  }
  if (cleanPath === '/') return '/en';
  return cleanPath.startsWith('/en') ? cleanPath : `/en${cleanPath}`;
}

export function englishSlugFromItalian(slug: string) {
  return EN_SLUG_MAP[slug] || slug;
}

export function englishPathFromItalian(path: string) {
  if (!path.startsWith('/')) return path;
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return '/';
  const [first, ...rest] = parts;
  return `/${englishSlugFromItalian(first)}${rest.length ? `/${rest.join('/')}` : ''}`;
}

export function italianSlugFromEnglish(slug: string) {
  return IT_SLUG_MAP[slug] || slug;
}

export function italianPathFromEnglish(path: string) {
  if (!path.startsWith('/')) return path;
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return '/';
  const [first, ...rest] = parts;
  return `/${italianSlugFromEnglish(first)}${rest.length ? `/${rest.join('/')}` : ''}`;
}

export function localizedField<T extends Record<string, any>>(entry: T | null | undefined, base: string, locale: SiteLocale) {
  if (!entry) return '';
  if (locale === 'en') {
    const key = `${base}_en`;
    if (typeof entry[key] === 'string' && entry[key].trim()) return entry[key];
  }
  const value = entry[base];
  return typeof value === 'string' ? value : '';
}
