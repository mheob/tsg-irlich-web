import type { SearchResult, SearchTab } from '@/lib/search/types';

import { getTotalHits } from '../_shared/search-params';
import { NoResults } from './no-results';
import type { NoResultsContent } from './no-results';
import { SearchResults } from './search-results';
import { SearchTabs } from './search-tabs';

/**
 * What a usable search term leads to: the summary, the tabs and the hits, or, when nothing was
 * found, the empty state.
 *
 * @param props - The section's props.
 * @param props.currentPage - The page of the „Seiten“ or „News“ tab, from 1.
 * @param props.noResults - `noResults` of the search page, `undefined` while the singleton is missing.
 * @param props.result - The result of the search.
 * @param props.tab - The current tab.
 * @returns The hits or the empty state.
 */
function SearchHits({ currentPage, noResults, result, tab }: Readonly<SearchHitsProps>) {
	const totalHits = getTotalHits(result);

	if (totalHits === 0) {
		return <NoResults content={noResults} query={result.query} />;
	}

	return (
		<>
			<p className="mt-8 text-sm text-muted-foreground md:text-base">
				<strong className="font-semibold text-foreground">{`${totalHits} Treffer`}</strong>{' '}
				{`für „${result.query}“`}
			</p>
			<SearchTabs query={result.query} tab={tab} totals={result.totals} />
			<SearchResults currentPage={currentPage} result={result} tab={tab} />
		</>
	);
}

interface SearchHitsProps {
	currentPage: number;
	noResults?: NoResultsContent;
	result: SearchResult;
	tab: SearchTab;
}

export { SearchHits };
