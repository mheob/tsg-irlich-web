import { describe, expect, it } from 'vite-plus/test';

import { getPageCount, getPageNumber, getPaginatedPath, getPaginationRange } from './pagination';

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

describe('the page count of a paginated overview', () => {
	it.each([
		{ pages: 32, perPage: 6, startIndex: 3, total: 191 },
		{ pages: 9, perPage: 9, startIndex: 0, total: 73 },
		{ pages: 1, perPage: 9, startIndex: 0, total: 9 },
		{ pages: 2, perPage: 9, startIndex: 0, total: 10 },
		{ pages: 4, perPage: 12, startIndex: 1, total: 41 },
	])(
		'is $pages for $total items, $perPage per page from index $startIndex',
		({ pages, perPage, startIndex, total }) => {
			expect(getPageCount({ perPage, startIndex, total })).toBe(pages);
		},
	);

	it.each([0, 3])('is 0 when no item is left after the start index (%i items)', (total) => {
		expect(getPageCount({ perPage: 6, startIndex: 3, total })).toBe(0);
	});
});

describe('the page links of a paginated overview', () => {
	it('lists every page when there are at most seven', () => {
		expect(getPaginationRange(4, 7)).toStrictEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	it('lists a single page', () => {
		expect(getPaginationRange(1, 1)).toStrictEqual([1]);
	});

	it.each([1, 4])('keeps the first five pages together on page %i', (currentPage) => {
		expect(getPaginationRange(currentPage, 32)).toStrictEqual([1, 2, 3, 4, 5, 'ellipsis-end', 32]);
	});

	it('shows the neighbours of a page in the middle', () => {
		expect(getPaginationRange(5, 32)).toStrictEqual([
			1,
			'ellipsis-start',
			4,
			5,
			6,
			'ellipsis-end',
			32,
		]);
	});

	it.each([29, 32])('keeps the last five pages together on page %i', (currentPage) => {
		expect(getPaginationRange(currentPage, 32)).toStrictEqual([
			1,
			'ellipsis-start',
			28,
			29,
			30,
			31,
			32,
		]);
	});

	it('hides at least two pages behind an ellipsis with eight pages', () => {
		expect(getPaginationRange(4, 8)).toStrictEqual([1, 2, 3, 4, 5, 'ellipsis-end', 8]);
		expect(getPaginationRange(5, 8)).toStrictEqual([1, 'ellipsis-start', 4, 5, 6, 7, 8]);
	});
});
