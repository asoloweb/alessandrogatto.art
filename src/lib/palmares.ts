import { directusFetch, directusItemsUrl } from './directus';

export interface PalmaresEntry {
	id: number;
	data: number | null;
	titolo: string;
	risultato: string | null;
}

const PALMARES_FIELDS = 'id,data,titolo,risultato';

export async function fetchPalmares(): Promise<PalmaresEntry[]> {
	try {
		const url = directusItemsUrl('palmares');
		url.searchParams.set('fields', PALMARES_FIELDS);
		url.searchParams.set('sort', '-data,titolo');
		url.searchParams.set('limit', '-1');

		const response = await directusFetch(url);
		if (!response.ok) return [];
		const payload = await response.json();
		return Array.isArray(payload?.data) ? (payload.data as PalmaresEntry[]) : [];
	} catch (error) {
		console.warn('[Directus] Unable to fetch palmares:', error);
		return [];
	}
}
