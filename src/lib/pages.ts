import { directusFetch, directusItemsUrl } from './directus';

const PAGE_FIELDS =
	'*,editor.item.*,editor.item.slider.*,editor.item.slider.slides.item.*,editor.item.card.single_card_id.*,editor.item.card.single_card_id.link.*';

export async function fetchPublishedPageBySlug(slug: string, slugEn?: string) {
	try {
		const url = directusItemsUrl('pages');
		url.searchParams.set('fields', PAGE_FIELDS);
		url.searchParams.set('filter[status][_eq]', 'published');
		url.searchParams.set('limit', '1');

		if (slugEn) {
			url.searchParams.set('filter[_or][0][slug_en][_eq]', slugEn);
			url.searchParams.set('filter[_or][1][slug][_eq]', slug);
		} else {
			url.searchParams.set('filter[slug][_eq]', slug);
		}

		const response = await directusFetch(url);
		if (!response.ok) return null;
		const payload = await response.json();
		return Array.isArray(payload?.data) ? payload.data[0] ?? null : payload?.data ?? null;
	} catch (error) {
		console.warn(`[Directus] Unable to fetch page by slug: ${slug}`);
		return null;
	}
}
