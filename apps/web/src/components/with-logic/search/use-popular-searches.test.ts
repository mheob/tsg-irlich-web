import { setTimeout as sleep } from 'node:timers/promises';

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { MockInstance } from 'vite-plus/test';

import type * as popularSearchesModule from './use-popular-searches';

const POPULAR = { terms: ['Fußball', 'Tanzen'], title: 'Häufig gesucht' };

/**
 * Imports the hook from a fresh module registry: the answer is kept per page load, which is per
 * module instance here.
 *
 * @returns The hook of a module that has not asked the route yet.
 */
async function loadHook(): Promise<typeof popularSearchesModule.usePopularSearches> {
	vi.resetModules();
	const { usePopularSearches } = await import('./use-popular-searches');
	return usePopularSearches;
}

/** Lets the pending request settle, so a test can tell "still loading" from "came back empty". */
async function flushRequests(): Promise<void> {
	await act(async () => {
		await sleep(0);
	});
}

describe('the popular searches of the panel', () => {
	let fetchSpy: MockInstance<typeof fetch>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch');
	});

	afterEach(() => {
		fetchSpy.mockRestore();
	});

	it('reads the heading and the terms from the route', async () => {
		fetchSpy.mockResolvedValue(Response.json(POPULAR));
		const usePopularSearches = await loadHook();

		const { result } = renderHook(() => usePopularSearches());

		expect(result.current).toBeNull();
		await waitFor(() => {
			expect(result.current).toStrictEqual(POPULAR);
		});
		expect(fetchSpy).toHaveBeenCalledWith('/api/search/popular');
	});

	it('asks the route only once per page load, however often the panel opens', async () => {
		fetchSpy.mockResolvedValueOnce(Response.json(POPULAR));
		const usePopularSearches = await loadHook();

		const first = renderHook(() => usePopularSearches());
		await waitFor(() => {
			expect(first.result.current).toStrictEqual(POPULAR);
		});
		first.unmount();

		const second = renderHook(() => usePopularSearches());
		await waitFor(() => {
			expect(second.result.current).toStrictEqual(POPULAR);
		});

		expect(fetchSpy).toHaveBeenCalledOnce();
	});

	it.each([
		[
			'the route answers with an error',
			(spy: MockInstance<typeof fetch>) =>
				spy.mockResolvedValueOnce(new Response('', { status: 500 })),
		],
		[
			'the body is no JSON',
			(spy: MockInstance<typeof fetch>) =>
				spy.mockResolvedValueOnce(new Response('<html>', { status: 200 })),
		],
		[
			'the network fails',
			(spy: MockInstance<typeof fetch>) =>
				spy.mockRejectedValueOnce(new TypeError('Failed to fetch')),
		],
	])('stays empty when %s, and asks again the next time', async (_case, fail) => {
		fail(fetchSpy).mockResolvedValueOnce(Response.json(POPULAR));
		const usePopularSearches = await loadHook();

		const first = renderHook(() => usePopularSearches());
		await flushRequests();
		expect(first.result.current).toBeNull();
		first.unmount();

		const second = renderHook(() => usePopularSearches());
		await waitFor(() => {
			expect(second.result.current).toStrictEqual(POPULAR);
		});
		expect(fetchSpy).toHaveBeenCalledTimes(2);
	});
});
