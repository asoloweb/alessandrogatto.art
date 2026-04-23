import type { APIRoute } from 'astro';
import { directusItemsUrl } from '../lib/directus';
import { slugifyNewsTitle } from '../lib/news-slug';
import { buildProductSlugMap } from '../lib/products';
import { slugifyLabel } from '../lib/slug';

export const prerender = true;

type UrlEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: string;
};

type DatedItem = {
  date_updated?: string;
  date_created?: string;
};

type CmsPage = DatedItem & {
  slug?: string;
  status?: string;
};

type NewsItem = DatedItem & {
  id?: number;
  titolo?: string;
  status?: string;
};

type ProductItem = DatedItem & {
  id?: number;
  titolo?: string;
  codice_prodotto?: string;
  status?: string;
};

type CategoryItem = DatedItem & {
  id?: number;
  titolo_categoria?: string;
  status?: string;
};

const SITE_URL = (
  import.meta.env.PUBLIC_SITE_URL ||
  import.meta.env.SITE_URL ||
  'https://stevanin.it'
).replace(/\/+$/, '');

function toIsoDate(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function pickLastmod(item: DatedItem) {
  return toIsoDate(item.date_updated) || toIsoDate(item.date_created);
}

function asPublishedArray<T extends { status?: string }>(data: unknown): T[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const status = (item as { status?: string }).status;
    return status === 'published';
  }) as T[];
}

async function fetchItems<T extends { status?: string }>(collection: string, fields: string): Promise<T[]> {
  try {
    const url = directusItemsUrl(collection);
    url.searchParams.set('fields', fields);
    url.searchParams.set('filter[status][_eq]', 'published');
    const response = await fetch(url);
    if (!response.ok) return [];
    const payload = await response.json();
    return asPublishedArray<T>(payload?.data);
  } catch {
    return [];
  }
}

function renderSitemapXml(entries: UrlEntry[]) {
  const rows = entries
    .map((entry) => {
      const fields = [
        `<loc>${entry.loc}</loc>`,
        entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : '',
        entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : '',
        entry.priority ? `<priority>${entry.priority}</priority>` : ''
      ]
        .filter(Boolean)
        .map((field) => `    ${field}`)
        .join('\n');

      return `  <url>\n${fields}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const staticEntries: UrlEntry[] = [
    { loc: `${SITE_URL}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/prodotti`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE_URL}/news`, lastmod: today, changefreq: 'daily', priority: '0.8' },
    { loc: `${SITE_URL}/contatti`, lastmod: today, changefreq: 'monthly', priority: '0.7' }
  ];

  const [pages, news, products, categories] = await Promise.all([
    fetchItems<CmsPage>('pages', 'slug,status,date_created,date_updated'),
    fetchItems<NewsItem>('News', 'id,titolo,status,date_created,date_updated'),
    fetchItems<ProductItem>('Prodotti', 'id,titolo,codice_prodotto,status,date_created,date_updated'),
    fetchItems<CategoryItem>('Categorie', 'id,titolo_categoria,status,date_created,date_updated')
  ]);

  const pageEntries: UrlEntry[] = pages
    .filter((page) => typeof page.slug === 'string' && page.slug && page.slug !== 'home')
    .map((page) => ({
      loc: `${SITE_URL}/${encodeURIComponent(page.slug!)}`,
      lastmod: pickLastmod(page),
      changefreq: 'weekly',
      priority: '0.8'
    }));

  const usedNewsSlugs = new Set<string>();
  const newsEntries: UrlEntry[] = news
    .filter((item) => typeof item.id === 'number')
    .map((item) => {
      const baseSlug = slugifyNewsTitle(item.titolo) || String(item.id);
      let resolvedSlug = baseSlug;
      if (usedNewsSlugs.has(resolvedSlug)) {
        resolvedSlug = `${baseSlug}-${item.id}`;
      }
      usedNewsSlugs.add(resolvedSlug);

      return {
        loc: `${SITE_URL}/news/${encodeURIComponent(resolvedSlug)}`,
        lastmod: pickLastmod(item),
        changefreq: 'weekly',
        priority: '0.7'
      };
    });

  const productSlugMap = buildProductSlugMap(products);
  const productEntries: UrlEntry[] = products
    .filter((item) => typeof item.id === 'number')
    .map((item) => ({
      loc: `${SITE_URL}/prodotti/${encodeURIComponent(productSlugMap.get(item.id!) || String(item.id))}`,
      lastmod: pickLastmod(item),
      changefreq: 'weekly',
      priority: '0.7'
    }));

  const usedCategorySlugs = new Set<string>();
  const categoryEntries: UrlEntry[] = categories
    .map((category): UrlEntry | null => {
      const slug = slugifyLabel(category.titolo_categoria) || String(category.id || '').trim();
      if (!slug || usedCategorySlugs.has(slug)) return null;
      usedCategorySlugs.add(slug);
      return {
        loc: `${SITE_URL}/prodotti/categoria/${encodeURIComponent(slug)}`,
        lastmod: pickLastmod(category),
        changefreq: 'weekly',
        priority: '0.7'
      };
    })
    .filter((entry): entry is UrlEntry => entry !== null);

  const dedupedEntries = Array.from(
    new Map(
      [...staticEntries, ...pageEntries, ...newsEntries, ...productEntries, ...categoryEntries].map((entry) => [
        entry.loc,
        entry
      ])
    ).values()
  );

  const xml = renderSitemapXml(dedupedEntries);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
};
