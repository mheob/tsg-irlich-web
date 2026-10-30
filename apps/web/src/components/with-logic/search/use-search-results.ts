import { useEffect, useState } from 'react';

import { settle } from '@tsgi-web/shared';

import { SEARCH_DEBOUNCE_MS } from '@/lib/search/constants';
import { normalizeSearchInput, toTextQuery } from '@/lib/search/query';
import type { SearchResult } from '@/lib/search/types';

/**
 * What the panel has to show:
 *
 * - `idle`: nothing to search for, the panel offers „Häufig gesucht“.
 * - `loading`: a search is waiting for its debounce or out for its answer.
 * - `done`: `result` answers the input.
 * - `error`: the search failed, `result` is still the last one that worked.
 */
type SearchStatus = 'done' | 'error' | 'idle' | 'loading';

interface SearchResultsState {
	result: SearchResult | null;
	status: SearchStatus;
}

/** The last request that ended, and the last result any request brought. */
interface SettledSearch {
	failed: boolean;
	result: SearchResult | null;
	/** The term the request was for, `null` before there was one. */
	term: string | null;
}

type FetchOutcome = { ok: false } | { ok: true; result: SearchResult | null };

const IDLE_SEARCH: SettledSearch = { failed: false, result: null, term: null };

/**
 * Asks the search route for a term.
 *
 * @param term - The normalized search term.
 * @param signal - Aborts the request.
 * @returns The route's answer, or `{ ok: false }` when the request, the status or the body failed.
 * A cancelled request fails too, and it is up to the caller to tell by the signal.
 */
async function fetchSearchResult(term: string, signal: AbortSignal): Promise<FetchOutcome> {
	// `URLSearchParams` escapes the `&`, the spaces and the umlauts a term can hold.
	const url = `/api/search?${new URLSearchParams({ q: term })}`;
	const response = await settle(fetch(url, { signal }));

	if (!response.ok || !response.value.ok) {
		return { ok: false };
	}

	const body = await settle<SearchResult | null>(response.value.json());

	return body.ok ? { ok: true, result: body.value } : { ok: false };
}

/**
 * Starts a search that waits for the debounce first.
 *
 * @param term - The normalized search term.
 * @param onSettled - Called with what the request brought, unless the search was cancelled.
 * @returns Cancels the search: the timer and, if it is out already, the request. A response that
 * is on its way anyway is dropped.
 */
function scheduleSearch(term: string, onSettled: (outcome: FetchOutcome) => void): () => void {
	const controller = new AbortController();

	async function search(): Promise<void> {
		const outcome = await fetchSearchResult(term, controller.signal);

		// An abort ends the request with an error, and a response can be settled already when the
		// abort comes: neither is the answer to what is typed now.
		if (!controller.signal.aborted) {
			onSettled(outcome);
		}
	}

	const timer = setTimeout(() => {
		// oxlint-disable-next-line no-void -- `search` settles its own errors, nothing can reject
		void search();
	}, SEARCH_DEBOUNCE_MS);

	return () => {
		clearTimeout(timer);
		controller.abort();
	};
}

/**
 * Derives what the panel shows from the input and the last request that ended.
 *
 * @param term - The search term, `undefined` when there is nothing to search for.
 * @param settled - The last request that ended.
 * @returns The status and the result.
 */
function getSearchState(term: string | undefined, settled: SettledSearch): SearchResultsState {
	if (term === undefined) {
		return { result: null, status: 'idle' };
	}

	if (settled.term !== term) {
		return { result: settled.result, status: 'loading' };
	}

	return { result: settled.result, status: settled.failed ? 'error' : 'done' };
}

/**
 * Looks the input up through the search route, once the visitor has stopped typing.
 *
 * The status follows the input in the same render, so the panel never shows an answer for
 * something else than what is typed:
 *
 * - Input without enough letters or digits to search for (the route's own test, `toTextQuery`) is
 *   `idle` and sends nothing. Its `result` is `null`.
 * - Any other input waits `SEARCH_DEBOUNCE_MS` after its last change and then asks
 *   `/api/search?q=`. Until the answer is in the status is `loading`, and the result of the
 *   previous search stays on screen, so the list does not flash empty between two keystrokes.
 * - A request is cancelled when the term changes or the component goes away, and a response of
 *   a cancelled request is dropped even when it was already on its way. An older response never
 *   replaces the result of a newer input.
 * - A network error, a status other than 2xx and a body that is not JSON all end in `error`, with
 *   the last result kept.
 *
 * @param input - What the visitor has typed.
 * @returns The status and the result of the search.
 */
function useSearchResults(input: string): SearchResultsState {
	const normalized = normalizeSearchInput(input);
	// The effect depends on the term as the route reads it, so a trailing space is no new search.
	const term = toTextQuery(normalized) === undefined ? undefined : normalized;
	const [settled, setSettled] = useState<SettledSearch>(IDLE_SEARCH);

	// Going idle forgets everything: a search for the same term later must start from `loading`
	// without the result of a search the visitor has long left behind. Adjusting state while
	// rendering, not in an effect, keeps that result from being painted for a frame.
	if (term === undefined && settled !== IDLE_SEARCH) {
		setSettled(IDLE_SEARCH);
	}

	useEffect(() => {
		if (term === undefined) {
			return;
		}

		// oxlint-disable-next-line typescript/consistent-return -- only a search has to be cancelled
		return scheduleSearch(term, (outcome) => {
			setSettled((previous) => ({
				failed: !outcome.ok,
				result: outcome.ok ? outcome.result : previous.result,
				term,
			}));
		});
	}, [term]);

	return getSearchState(term, settled);
}

export { useSearchResults };
export type { SearchResultsState, SearchStatus };
