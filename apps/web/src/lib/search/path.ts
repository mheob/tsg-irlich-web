import type { SearchTab } from './types';

/** The path of the search page. */
const SEARCH_PATH = '/suche';

/**
 * Builds the path of the search page for a search term, optionally on one of its tabs. The URL
 * contract of the page is `q` (the term), `typ` (`seiten` or `news`, missing for „Alle“) and `seite`
 * (the page of a tab, from 2 on, which `getPaginatedPath` appends).
 *
 * @param query - The search term, as the visitor typed it.
 * @param tab - The tab to open, „Alle“ when it is missing.
 * @returns The path with its query string.
 */
function getSearchPath(query: string, tab: SearchTab = 'alle'): string {
	const path = `${SEARCH_PATH}?q=${encodeURIComponent(query)}`;
	return tab === 'alle' ? path : `${path}&typ=${tab}`;
}

export { getSearchPath, SEARCH_PATH };
