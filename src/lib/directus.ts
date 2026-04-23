const rawDirectusUrl =
	import.meta.env.PUBLIC_DIRECTUS_URL ||
	import.meta.env.DIRECTUS_URL ||
	'https://admin.stevanin.it';

export const DIRECTUS_URL = rawDirectusUrl.replace(/\/+$/, '');

export function directusItemsUrl(path: string) {
	const cleanedPath = path.replace(/^\/+/, '');
	return new URL(`/items/${cleanedPath}`, DIRECTUS_URL);
}

type DirectusAssetOptions = {
	width?: number;
	height?: number;
	quality?: number;
	format?: 'webp' | 'avif' | 'jpg' | 'jpeg' | 'png';
};

export function directusAssetUrl(value: string | undefined, options: DirectusAssetOptions = {}) {
	if (!value) return '';

	const applyTransforms = (url: URL) => {
		const { width, height, quality, format } = options;

		const hasWidth = typeof width === 'number' && Number.isFinite(width) && width > 0;
		const hasHeight = typeof height === 'number' && Number.isFinite(height) && height > 0;

		if (hasWidth) {
			url.searchParams.set('width', String(Math.round(width)));
		}

		// Avoid visual crops: when both dimensions are provided, prefer width-only
		// so Directus keeps the original aspect ratio.
		if (hasHeight && !hasWidth) {
			url.searchParams.set('height', String(Math.round(height)));
		}

		if (typeof quality === 'number' && Number.isFinite(quality) && quality > 0) {
			const clampedQuality = Math.min(100, Math.max(1, Math.round(quality)));
			url.searchParams.set('quality', String(clampedQuality));
		}

		if (format) {
			url.searchParams.set('format', format);
		}

		return url.toString();
	};

	if (value.startsWith('http://') || value.startsWith('https://')) {
		try {
			const url = new URL(value);
			if (url.origin !== DIRECTUS_URL || !url.pathname.startsWith('/assets/')) {
				return value;
			}
			return applyTransforms(url);
		} catch {
			return value;
		}
	}

	if (value.startsWith('/assets/')) {
		return applyTransforms(new URL(value, DIRECTUS_URL));
	}

	if (value.startsWith('/')) {
		return value;
	}

	return applyTransforms(new URL(`/assets/${value}`, DIRECTUS_URL));
}
