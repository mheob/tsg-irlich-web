import { useEffect, useState } from 'react';

import { settle } from '@tsgi-web/shared';

import type { PopularSearches } from '@/lib/search/popular';

const POPULAR_SEARCHES_PATH = '/api/search/popular';

/**
 * The request for „Häufig gesucht“, shared by every time the panel opens until the next page load.
 * A request that failed is forgotten, so the next opening asks again.
 */
let popularSearchesRequest: null | Promise<null | PopularSearches> = null;

/**
 * Asks the route for „Häufig gesucht“.
 *
 * @returns The heading and the terms, or `null` when the request, the status or the body failed.
 */
async function fetchPopularSearches(): Promise<null | PopularSearches> {
	const response = await settle(fetch(POPULAR_SEARCHES_PATH));

	if (!response.ok || !response.value.ok) {
		return null;
	}

	const body = await settle<PopularSearches>(response.value.json());

	return body.ok ? body.value : null;
}

/**
 * Starts the request for „Häufig gesucht“, or joins the one that is already out or has answered.
 *
 * @returns The heading and the terms, or `null` when they could not be loaded.
 */
async function loadPopularSearches(): Promise<null | PopularSearches> {
	popularSearchesRequest ??= fetchPopularSearches();
	const request = popularSearchesRequest;
	const popularSearches = await request;

	// A later opening may have started a new request already, which must stay.
	if (popularSearches === null && popularSearchesRequest === request) {
		popularSearchesRequest = null;
	}

	return popularSearches;
}

/**
 * „Häufig gesucht“ for the panel, which shows it while the input holds nothing to search for. The
 * route is asked once per page load, however often the panel opens.
 *
 * @returns The heading and the terms, `null` while they load or when they could not be loaded.
 */
function usePopularSearches(): null | PopularSearches {
	const [popularSearches, setPopularSearches] = useState<null | PopularSearches>(null);

	useEffect(() => {
		let isCurrent = true;

		async function load(): Promise<void> {
			const loaded = await loadPopularSearches();

			// The panel may have closed in the meantime.
			if (isCurrent) {
				setPopularSearches(loaded);
			}
		}

		// oxlint-disable-next-line no-void -- `load` settles its own errors, nothing can reject
		void load();

		return () => {
			isCurrent = false;
		};
	}, []);

	return popularSearches;
}

export { usePopularSearches };
