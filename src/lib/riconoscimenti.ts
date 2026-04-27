import { directusFetch, directusItemsUrl } from './directus';

export interface Riconoscimento {
	id: number;
	status: string;
	sort: number;
	titolo: string;
	titolo_en: string;
	descrizione: string;
	descrizione_en: string;
	link_esterno: string | null;
	data: number;
}

const RICONOSCIMENTI_FIELDS = 'id,status,sort,titolo,titolo_en,descrizione,descrizione_en,link_esterno,data';

export async function fetchRiconoscimenti(): Promise<Riconoscimento[]> {
	try {
		const url = directusItemsUrl('riconoscimenti');
		url.searchParams.set('fields', RICONOSCIMENTI_FIELDS);
		url.searchParams.set('filter[status][_eq]', 'published');
		url.searchParams.set('sort', '-data');
		url.searchParams.set('limit', '-1');

		const response = await directusFetch(url);
		if (!response.ok) return [];
		const payload = await response.json();
		return Array.isArray(payload?.data) ? (payload.data as Riconoscimento[]) : [];
	} catch (error) {
		console.warn('[Directus] Unable to fetch riconoscimenti:', error);
		return [];
	}
}