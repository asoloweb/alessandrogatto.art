import { directusFetch, directusItemsUrl } from './directus';

export interface Riconoscimento {
	id: number;
	titolo: string;
	titolo_en: string;
	descrizione: string;
	descrizione_en: string;
	link_esterno: string | null;
	data: number;
}

const PALMARES_FIELDS = 'id,titolo,risultato,data';

export async function fetchRiconoscimenti(): Promise<Riconoscimento[]> {
	try {
		const url = directusItemsUrl('palmares');
		url.searchParams.set('fields', PALMARES_FIELDS);
		url.searchParams.set('sort', '-data');
		url.searchParams.set('limit', '-1');

		const response = await directusFetch(url);
		if (!response.ok) return [];
		const payload = await response.json();
		if (!Array.isArray(payload?.data)) return [];
		return payload.data.map((item: any) => ({
			id: item.id,
			titolo: item.titolo || '',
			titolo_en: item.titolo || '',
			descrizione: item.risultato || '',
			descrizione_en: item.risultato || '',
			link_esterno: null,
			data: item.data,
		})) as Riconoscimento[];
	} catch (error) {
		console.warn('[Directus] Unable to fetch palmares:', error);
		return [];
	}
}
