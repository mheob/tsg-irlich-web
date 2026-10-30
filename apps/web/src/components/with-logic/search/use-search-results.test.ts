import { act, renderHook } from '@testing-library/react';
import type { RenderHookResult } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { SearchResult } from '@/lib/search/types';

import { createFetchMock } from '../../../../test-utils/fetch-mock';
import type { FetchCall } from '../../../../test-utils/fetch-mock';
import { useSearchResults } from './use-search-results';
import type { SearchResultsState } from './use-search-results';

const DEBOUNCE_MS = 250;

/** The request a deferred `fetch` is holding back. */
interface PendingRequest {
	reject: (reason: unknown) => void;
	resolve: (body: unknown) => void;
	signal: AbortSignal;
	url: string;
}

/**
 * Builds a search result for a term.
 *
 * @param query - The term the result answers.
 * @returns A result with no hits, which is enough to tell two results apart.
 */
function createResult(query: string): SearchResult {
	return {
		news: [],
		pages: [],
		query,
		totals: { news: 0, pages: 0 },
		words: [query.toLowerCase()],
	};
}

/**
 * Reads the `q` parameter of a request url.
 *
 * @param url - The url the hook fetched.
 * @returns The decoded value of `q`.
 */
function getQuery(url: string): string | null {
	return new URL(url, 'http://localhost').searchParams.get('q');
}

/**
 * Reads the url of a recorded request.
 *
 * @param calls - The calls the fetch mock recorded.
 * @param index - Which call.
 * @returns The url of the call.
 * @throws {Error} When there is no such call.
 */
function getCallUrl(calls: FetchCall[], index: number): string {
	const call = calls.at(index);

	if (!call) {
		throw new Error(`No request number ${index} was made`);
	}

	return call.url;
}

/**
 * Reads a request a deferred `fetch` is holding.
 *
 * @param requests - The requests `stubDeferredFetch` collected.
 * @param index - Which request.
 * @returns The request.
 * @throws {Error} When there is no such request.
 */
function getRequest(requests: PendingRequest[], index: number): PendingRequest {
	const request = requests.at(index);

	if (!request) {
		throw new Error(`No request number ${index} was made`);
	}

	return request;
}

/**
 * Moves the fake clock forward and lets the pending promises settle, inside `act`.
 *
 * @param milliseconds - How far to move the clock.
 */
async function advance(milliseconds: number): Promise<void> {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(milliseconds);
	});
}

/**
 * Lets a held request answer, inside `act`.
 *
 * @param settle - What to do with the request.
 */
async function answer(settle: () => void): Promise<void> {
	await act(async () => {
		settle();
		await vi.advanceTimersByTimeAsync(0);
	});
}

/**
 * Replaces `fetch` with one that answers only when the test says so, to put responses in any order.
 *
 * @param options - The options.
 * @param options.honorAbort - Makes a request reject with an `AbortError` as soon as its signal
 * aborts, the way the real `fetch` does. Left off, an aborted request can still be answered.
 * @returns The requests, in the order they were made.
 */
function stubDeferredFetch({ honorAbort }: { honorAbort: boolean }): PendingRequest[] {
	const requests: PendingRequest[] = [];

	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: { signal: AbortSignal }): Promise<Response> => {
			const { promise, reject, resolve } = Promise.withResolvers<Response>();

			requests.push({
				reject,
				resolve: (body) => {
					resolve(Response.json(body));
				},
				signal: init.signal,
				url,
			});

			if (honorAbort) {
				init.signal.addEventListener('abort', () => {
					reject(new DOMException('The operation was aborted.', 'AbortError'));
				});
			}

			return promise;
		}),
	);

	return requests;
}

/**
 * Renders the hook with an input that tests change through `rerender`.
 *
 * @param input - The input the hook starts with.
 * @returns What `renderHook` returns.
 */
function renderSearch(input = ''): RenderHookResult<SearchResultsState, { value: string }> {
	return renderHook(({ value }) => useSearchResults(value), { initialProps: { value: input } });
}

describe('search results hook', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		mock?.restore();
		mock = undefined;
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it.each(['', 'a', '..', '  ', '-', '"*"', 'a.'])(
		'stays idle without a request for the input "%s"',
		async (value) => {
			mock = createFetchMock();
			const { result } = renderSearch(value);

			await advance(DEBOUNCE_MS * 2);

			expect(result.current).toStrictEqual({ result: null, status: 'idle' });
			expect(mock.calls).toHaveLength(0);
		},
	);

	it('fetches once, after the debounce, for the term typed last', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Ta'));
		const { rerender } = renderSearch('T');

		rerender({ value: 'Ta' });
		await advance(DEBOUNCE_MS - 1);

		expect(mock.calls).toHaveLength(0);

		await advance(1);

		expect(mock.calls).toHaveLength(1);
		expect(getCallUrl(mock.calls, 0).startsWith('/api/search?')).toBe(true);
		expect(getQuery(getCallUrl(mock.calls, 0))).toBe('Ta');
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('restarts the debounce with every keystroke', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Tanz'));
		const { rerender } = renderSearch('Ta');

		await advance(200);
		rerender({ value: 'Tan' });
		await advance(200);
		rerender({ value: 'Tanz' });
		await advance(200);

		expect(mock.calls).toHaveLength(0);

		await advance(50);

		expect(mock.calls.map((call) => getQuery(call.url))).toStrictEqual(['Tanz']);
	});

	it('does not search again when only the whitespace around the term changes', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Tanz'));
		const { rerender, result } = renderSearch('Tanz');

		await advance(DEBOUNCE_MS);
		rerender({ value: ' Tanz  ' });
		await advance(DEBOUNCE_MS * 2);

		expect(mock.calls).toHaveLength(1);
		expect(result.current.status).toBe('done');
	});

	it('reports loading while the request is out and done with its result after', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Tanz'));
		const { result } = renderSearch('Tanz');

		expect(result.current).toStrictEqual({ result: null, status: 'loading' });

		await advance(DEBOUNCE_MS);

		expect(result.current).toStrictEqual({ result: createResult('Tanz'), status: 'done' });
	});

	it('keeps showing the previous result while the next request is pending', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Tan'));
		mock.enqueueJson(createResult('Tanz'));
		const { rerender, result } = renderSearch('Tan');

		await advance(DEBOUNCE_MS);
		rerender({ value: 'Tanz' });

		expect(result.current).toStrictEqual({ result: createResult('Tan'), status: 'loading' });

		await advance(DEBOUNCE_MS);

		expect(result.current).toStrictEqual({ result: createResult('Tanz'), status: 'done' });
	});

	it('sends the term so that ampersands, spaces and umlauts survive', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Bälle & Tore'));
		renderSearch('Bälle & Tore');

		await advance(DEBOUNCE_MS);

		const url = getCallUrl(mock.calls, 0);

		expect(getQuery(url)).toBe('Bälle & Tore');
		expect(url).not.toContain('&Tore');
		expect(url).not.toContain(' ');
	});

	it('sends the term the way the route reads it', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Tanz Fitness'));
		renderSearch('  Tanz \n  Fitness  ');

		await advance(DEBOUNCE_MS);

		expect(getQuery(getCallUrl(mock.calls, 0))).toBe('Tanz Fitness');
	});

	it('goes back to idle without a result when the input is cleared', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Tanz'));
		const { rerender, result } = renderSearch('Tanz');

		await advance(DEBOUNCE_MS);
		rerender({ value: '' });

		expect(result.current).toStrictEqual({ result: null, status: 'idle' });
	});

	it('does not show the result of an earlier search once the input was cleared in between', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Tanz'));
		mock.enqueueJson(createResult('Tanz'));
		const { rerender, result } = renderSearch('Tanz');

		await advance(DEBOUNCE_MS);
		rerender({ value: '' });
		rerender({ value: 'Tanz' });

		expect(result.current).toStrictEqual({ result: null, status: 'loading' });

		await advance(DEBOUNCE_MS);

		expect(result.current.status).toBe('done');
	});

	it('cancels a request that is still waiting for its debounce when the input is cleared', async () => {
		mock = createFetchMock();
		const { rerender } = renderSearch('Tanz');

		await advance(DEBOUNCE_MS - 1);
		rerender({ value: '' });
		await advance(DEBOUNCE_MS * 2);

		expect(mock.calls).toHaveLength(0);
	});

	it('answers a network error with the error status', async () => {
		mock = createFetchMock();
		const { result } = renderSearch('Tanz');

		await advance(DEBOUNCE_MS);

		expect(mock.unqueued).toHaveLength(1);
		expect(result.current).toStrictEqual({ result: null, status: 'error' });
	});

	it('answers a non-OK response with the error status', async () => {
		mock = createFetchMock();
		mock.enqueueJson(null, { status: 500 });
		const { result } = renderSearch('Tanz');

		await advance(DEBOUNCE_MS);

		expect(result.current).toStrictEqual({ result: null, status: 'error' });
	});

	it('answers a body that is not JSON with the error status', async () => {
		mock = createFetchMock();
		mock.enqueue({ body: '<html>Bad Gateway</html>', status: 200 });
		const { result } = renderSearch('Tanz');

		await advance(DEBOUNCE_MS);

		expect(result.current).toStrictEqual({ result: null, status: 'error' });
	});

	it('keeps the last result when a later request fails', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Tan'));
		mock.enqueueJson(null, { status: 500 });
		const { rerender, result } = renderSearch('Tan');

		await advance(DEBOUNCE_MS);
		rerender({ value: 'Tanz' });
		await advance(DEBOUNCE_MS);

		expect(result.current).toStrictEqual({ result: createResult('Tan'), status: 'error' });
	});

	it('recovers from an error with the next successful search', async () => {
		mock = createFetchMock();
		mock.enqueueJson(null, { status: 500 });
		mock.enqueueJson(createResult('Tanz'));
		const { rerender, result } = renderSearch('Tan');

		await advance(DEBOUNCE_MS);
		rerender({ value: 'Tanz' });
		await advance(DEBOUNCE_MS);

		expect(result.current).toStrictEqual({ result: createResult('Tanz'), status: 'done' });
	});

	it('keeps the result of the newest input when a slow earlier response arrives after it', async () => {
		const requests = stubDeferredFetch({ honorAbort: false });
		const { rerender, result } = renderSearch('Ta');

		await advance(DEBOUNCE_MS);
		rerender({ value: 'Tan' });
		await advance(DEBOUNCE_MS);

		expect(requests.map((request) => getQuery(request.url))).toStrictEqual(['Ta', 'Tan']);

		await answer(() => {
			getRequest(requests, 1).resolve(createResult('Tan'));
		});

		expect(result.current).toStrictEqual({ result: createResult('Tan'), status: 'done' });

		await answer(() => {
			getRequest(requests, 0).resolve(createResult('Ta'));
		});

		expect(result.current).toStrictEqual({ result: createResult('Tan'), status: 'done' });
	});

	it('ignores a failure of an earlier request that arrives after a newer result', async () => {
		const requests = stubDeferredFetch({ honorAbort: false });
		const { rerender, result } = renderSearch('Ta');

		await advance(DEBOUNCE_MS);
		rerender({ value: 'Tan' });
		await advance(DEBOUNCE_MS);

		await answer(() => {
			getRequest(requests, 1).resolve(createResult('Tan'));
		});
		await answer(() => {
			getRequest(requests, 0).reject(new TypeError('Failed to fetch'));
		});

		expect(result.current).toStrictEqual({ result: createResult('Tan'), status: 'done' });
	});

	it('aborts the previous request as soon as the term changes', async () => {
		const requests = stubDeferredFetch({ honorAbort: true });
		const { rerender } = renderSearch('Ta');

		await advance(DEBOUNCE_MS);

		expect(getRequest(requests, 0).signal.aborted).toBe(false);

		rerender({ value: 'Tan' });

		expect(getRequest(requests, 0).signal.aborted).toBe(true);
	});

	it('does not read the abort of a replaced request as an error', async () => {
		stubDeferredFetch({ honorAbort: true });
		const { rerender, result } = renderSearch('Ta');

		await advance(DEBOUNCE_MS);
		rerender({ value: 'Tan' });
		await advance(0);

		expect(result.current).toStrictEqual({ result: null, status: 'loading' });
	});

	it('aborts a request that is still out when the component unmounts', async () => {
		const requests = stubDeferredFetch({ honorAbort: true });
		const { unmount } = renderSearch('Ta');

		await advance(DEBOUNCE_MS);
		unmount();

		expect(getRequest(requests, 0).signal.aborted).toBe(true);
	});

	it('searches again for a term that comes back after a detour', async () => {
		mock = createFetchMock();
		mock.enqueueJson(createResult('Tan'));
		mock.enqueueJson(createResult('Tan'));
		const { rerender, result } = renderSearch('Tan');

		await advance(DEBOUNCE_MS);
		rerender({ value: 'Tanz' });
		rerender({ value: 'Tan' });
		await advance(DEBOUNCE_MS);

		expect(mock.calls).toHaveLength(2);
		expect(result.current.status).toBe('done');
	});
});
