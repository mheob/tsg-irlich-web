import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vitest';

import newsArticle from './news.article';

interface NewsArticleSelection {
	readonly media?: PreviewValue['media'];
	readonly publishedAt?: string;
	readonly title?: string;
}

function prepareNewsArticle(selection: NewsArticleSelection): PreviewValue {
	return (newsArticle.preview.prepare as unknown as (value: NewsArticleSelection) => PreviewValue)(
		selection,
	);
}

describe('news article preview', () => {
	// The expected date prefix is hard-coded rather than produced by calling `formatDate` — its own
	// `YY-MM-DD` behavior for this exact timestamp is separately pinned in `utils/time.test.ts`.
	it('prefixes the title with the formatted publish date when one is set', () => {
		const media = 'media-asset-abc';

		const result = prepareNewsArticle({
			media,
			publishedAt: '2026-08-25T10:00:00.000Z',
			title: 'Sommerfest 2026',
		});

		expect(result).toStrictEqual({ media, title: '26-08-25 - Sommerfest 2026' });
	});

	it('leaves the title unprefixed when there is no publish date, even with media set', () => {
		const media = 'media-asset-abc';

		const result = prepareNewsArticle({ media, title: 'Entwurf' });

		expect(result).toStrictEqual({ media, title: 'Entwurf' });
	});

	it('passes an absent media selection through as undefined when a publish date is set', () => {
		const result = prepareNewsArticle({
			publishedAt: '2026-01-01T00:00:00.000Z',
			title: 'Neujahr',
		});

		expect(result).toStrictEqual({ media: undefined, title: '26-01-01 - Neujahr' });
	});

	it('passes the selected media through unchanged', () => {
		const media = 'media-asset-xyz';

		const result = prepareNewsArticle({
			media,
			publishedAt: '2026-01-01T00:00:00.000Z',
			title: 'Neujahr',
		});

		expect(result.media).toBe(media);
	});
});
