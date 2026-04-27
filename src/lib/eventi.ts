import { directusFetch, directusItemsUrl, directusAssetUrl } from './directus';

export interface Evento {
	id: number;
	status: string;
	sort: number;
	titolo_evento: string;
	titolo_evento_en: string;
	descrizione: string;
	descrizione_en: string;
	data_inizio: string | null;
	data_fine: string | null;
	foto_copertina: string | null;
	location: string | null;
	link_esterno: string | null;
}

const EVENTI_FIELDS = 'id,status,sort,titolo_evento,titolo_evento_en,descrizione,descrizione_en,data_inizio,data_fine,foto_copertina,location,link_esterno';

export async function fetchEventi(): Promise<Evento[]> {
	try {
		const url = directusItemsUrl('eventi');
		url.searchParams.set('fields', EVENTI_FIELDS);
		url.searchParams.set('filter[status][_eq]', 'published');
		url.searchParams.set('sort', '-data_inizio');
		url.searchParams.set('limit', '-1');

		const response = await directusFetch(url);
		if (!response.ok) return [];
		const payload = await response.json();
		return Array.isArray(payload?.data) ? (payload.data as Evento[]) : [];
	} catch (error) {
		console.warn('[Directus] Unable to fetch eventi:', error);
		return [];
	}
}

export function eventoCoverUrl(fotoId: string | null) {
	return directusAssetUrl(fotoId, {
		width: 1200,
		quality: 80,
		format: 'webp',
		fit: 'cover',
	});
}

export function formatEventoDate(dateStr: string | null, locale: string = 'it'): string {
	if (!dateStr) return '';
	const date = new Date(dateStr);
	return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'it-IT', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
}

export function formatEventoDateRange(inizio: string | null, fine: string | null, locale: string = 'it'): string {
	const start = inizio ? formatEventoDate(inizio, locale) : '';
	const end = fine ? formatEventoDate(fine, locale) : '';
	
	if (start && end && start !== end) {
		return `${start} - ${end}`;
	}
	return start || '';
}