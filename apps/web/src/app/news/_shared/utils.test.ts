import { describe, expect, it } from 'vite-plus/test';

import { getArticlePath, getPageNumber, getPaginatedPath } from './utils';

describe('the page number of a news overview', () => {
	it('is the first page without a parameter', () => {
		expect(getPageNumber()).toBe(1);
	});

	it('reads the parameter', () => {
		expect(getPageNumber('3')).toBe(3);
	});

	it('takes the first of several parameters', () => {
		expect(getPageNumber(['2', '5'])).toBe(2);
	});

	it('drops the fraction of a decimal number', () => {
		expect(getPageNumber('2.7')).toBe(2);
	});

	it.each(['abc', '0', '-2', 'Infinity'])('is the first page for %s', (page) => {
		expect(getPageNumber(page)).toBe(1);
	});
});

describe('the canonical path of a news overview page', () => {
	it('drops the parameter on the first page', () => {
		expect(getPaginatedPath('/news', 1)).toBe('/news');
	});

	it('points every later page at itself', () => {
		expect(getPaginatedPath('/news/fussball', 2)).toBe('/news/fussball?seite=2');
	});
});

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
