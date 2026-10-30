import { HITS_PER_PAGE } from '@/lib/search/constants';
import type { SearchResult, SearchTab } from '@/lib/search/types';
import { getPageCount } from '@/utils/pagination';

/**
 * Reads the tab from the `typ` search parameter.
 *
 * @param typ - The raw `typ` search parameter.
 * @returns `seiten` or `news`, and „Alle“ for everything else, a missing parameter included.
 */
function getTab(typ?: string | string[]): SearchTab {
	const value = Array.isArray(typ) ? typ[0] : typ;
	return value === 'seiten' || value === 'news' ? value : 'alle';
}

/**
 * The number of hits in both groups together, which is what the summary and the „Alle“ tab count.
 *
 * @param result - The result of a search.
 * @returns The sum of both totals.
 */
function getTotalHits(result: SearchResult): number {
	return result.totals.pages + result.totals.news;
}

/**
 * Whether a tab was asked for a page it does not have. „Alle“ has no pages. A tab counts its pages
 * by the total of its own group, and has at least its first page, however few hits it holds.
 *
 * @param result - The result of a search.
 * @param tab - The current tab.
 * @param page - The requested page, from 1.
 * @returns `true` when the page lies beyond the last one.
 */
function isBeyondLastPage(result: SearchResult, tab: SearchTab, page: number): boolean {
	if (tab === 'alle') {
		return false;
	}

	const total = tab === 'seiten' ? result.totals.pages : result.totals.news;
	return page > Math.max(getPageCount({ perPage: HITS_PER_PAGE, startIndex: 0, total }), 1);
}

export { getTab, getTotalHits, isBeyondLastPage };
