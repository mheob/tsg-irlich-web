import { describe, expect, it } from 'vite-plus/test';

import { getPageNumber, getPaginatedPath } from './pagination';

describe('the page number of a paginated overview', () => {
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

describe('the canonical path of a paginated overview page', () => {
	it('drops the parameter on the first page', () => {
		expect(getPaginatedPath('/news', 1)).toBe('/news');
	});

	it('points every later page at itself', () => {
		expect(getPaginatedPath('/news/fussball', 2)).toBe('/news/fussball?seite=2');
	});
});
