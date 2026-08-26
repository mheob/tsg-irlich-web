import { render } from 'react-email';
import { describe, expect, it } from 'vitest';

import { NewsGrid } from './news-grid';

// How many times `needle` occurs in `haystack`, without regex escaping pitfalls.
function occurrences(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1;
}

describe('news grid', () => {
	it('renders nothing for an empty list', async () => {
		const html = await render(NewsGrid({ news: [] }));

		expect(html).not.toContain('<table');
		expect(html).not.toContain('Aus dem Verein');
	});

	it('renders one entry per news item', async () => {
		const news = [
			{
				category: 'Fußball',
				href: 'https://example.com/news/erste-meldung',
				imageUrl: 'https://example.com/1.png',
				teaser: 'Teaser eins',
				title: 'Erste Meldung',
			},
			{
				category: 'Handball',
				href: 'https://example.com/news/zweite-meldung',
				imageUrl: 'https://example.com/2.png',
				teaser: 'Teaser zwei',
				title: 'Zweite Meldung',
			},
			{
				category: 'Volleyball',
				href: 'https://example.com/news/dritte-meldung',
				imageUrl: 'https://example.com/3.png',
				teaser: 'Teaser drei',
				title: 'Dritte Meldung',
			},
		];

		const html = await render(NewsGrid({ news }));

		for (const article of news) {
			expect(occurrences(html, `href="${article.href}"`)).toBe(1);
		}
	});
});
