import { client } from '@/lib/sanity/client';
import { searchPageQuery } from '@/lib/sanity/queries/search';
import type { SearchPageQueryResult } from '@/types/sanity.types';

/** The title of the page while the singleton is missing. */
const FALLBACK_TITLE = 'Suche';

/** The tag the revalidation webhook expires when the singleton changes. */
const SEARCH_PAGE_TAG = 'searchPage';

/**
 * How long the singleton is cached, in seconds. The revalidation webhook expires it earlier, through
 * its tag.
 */
const SEARCH_PAGE_REVALIDATE_SECONDS = 3600;

/**
 * Reads the search page singleton. The texts of the page are no search content, but they are read
 * as published like every other fetch of the search, also while draft mode is on: the page is not
 * previewable.
 *
 * @returns The singleton, or `null` while it does not exist.
 */
async function fetchSearchPage(): Promise<SearchPageQueryResult> {
	return client.fetch<SearchPageQueryResult>(
		searchPageQuery,
		{},
		{
			next: { revalidate: SEARCH_PAGE_REVALIDATE_SECONDS, tags: [SEARCH_PAGE_TAG] },
			perspective: 'published',
		},
	);
}

export { FALLBACK_TITLE, fetchSearchPage };
