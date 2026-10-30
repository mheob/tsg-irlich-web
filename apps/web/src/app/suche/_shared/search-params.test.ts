import { describe, expect, it } from 'vite-plus/test';

import { buildSearchResult } from '../../../../test-utils/search-fixtures';
import { getTab, getTotalHits, isBeyondLastPage } from './search-params';

describe('the tab of the typ parameter', () => {
	it.each([
		['seiten', 'seiten'],
		['news', 'news'],
		['alle', 'alle'],
		['foo', 'alle'],
		['NEWS', 'alle'],
		['', 'alle'],
		[undefined, 'alle'],
		[['news', 'seiten'], 'news'],
	] as const)('reads %j as %s', (typ, tab) => {
		expect(getTab(typ as string | string[] | undefined)).toBe(tab);
	});
});

describe('the number of hits of a search', () => {
	it('adds both groups', () => {
		expect(getTotalHits(buildSearchResult({ totals: { news: 26, pages: 4 } }))).toBe(30);
	});
});

describe('a page beyond the last one', () => {
	const result = buildSearchResult({ totals: { news: 26, pages: 10 } });

	it.each([
		{ beyond: false, page: 3, tab: 'news' },
		{ beyond: true, page: 4, tab: 'news' },
		{ beyond: false, page: 1, tab: 'seiten' },
		{ beyond: true, page: 2, tab: 'seiten' },
	] as const)('is $beyond for page $page of the $tab tab', ({ beyond, page, tab }) => {
		expect(isBeyondLastPage(result, tab, page)).toBe(beyond);
	});

	it('never exists on „Alle“', () => {
		expect(isBeyondLastPage(result, 'alle', 99)).toBe(false);
	});

	it('does not exist for the first page of a tab without a hit', () => {
		expect(isBeyondLastPage(buildSearchResult(), 'news', 1)).toBe(false);
	});

	it('exists for every later page of a tab without a hit', () => {
		expect(isBeyondLastPage(buildSearchResult(), 'news', 2)).toBe(true);
	});
});
