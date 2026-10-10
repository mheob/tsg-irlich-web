import { describe, expect, it } from 'vite-plus/test';

import { getArticlePath } from './utils';

describe('the path of an article', () => {
	it('names the first category of the article', () => {
		expect(
			getArticlePath(
				{ categories: [{ slug: 'fussball' }, { slug: 'verein' }], slug: 'sieg' },
				'verein',
				'sieg',
			),
		).toBe('/news/fussball/sieg');
	});

	it('falls back to the requested segments', () => {
		expect(getArticlePath({ categories: null, slug: null }, 'verein', 'sieg')).toBe(
			'/news/verein/sieg',
		);
	});
});
