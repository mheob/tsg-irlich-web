import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { GET, revalidate } from '@/app/api/search/popular/route';
import type { client } from '@/lib/sanity/client';

import { clientFetchMock } from '../../../../../test-utils/sanity-client-mock';

// The real client validates `NEXT_PUBLIC_SANITY_*` at import time and would talk to the content
// lake.
vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

describe('popular searches route', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('answers the heading and the terms as JSON', async () => {
		mockedFetch.mockResolvedValue({
			blockedTerms: ['Fußball'],
			pinnedTerms: ['Tanzen', 'Fußball', 'tanzen', 'Probetraining'],
			title: 'Beliebt',
		});

		const response = await GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toStrictEqual({
			terms: ['Tanzen', 'Probetraining'],
			title: 'Beliebt',
		});
	});

	it('answers the fallback heading without terms while the singleton is missing', async () => {
		mockedFetch.mockResolvedValue(null);

		const response = await GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toStrictEqual({ terms: [], title: 'Häufig gesucht' });
	});

	it('is cached for an hour', () => {
		expect(revalidate).toBe(3600);
	});
});
