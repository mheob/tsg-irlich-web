import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';
import { searchPopularSettingsQuery } from '@/lib/sanity/queries/search';
import type { SearchPopularSettingsQueryResult } from '@/types/sanity.types';

import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
import { POPULAR_SEARCHES_LIMIT } from './constants';
import { getPopularSearches } from './popular';

// The real client validates `NEXT_PUBLIC_SANITY_*` at import time and would talk to the content
// lake.
vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

type PopularSettings = NonNullable<SearchPopularSettingsQueryResult>;

/**
 * Lets the singleton answer with the given popular searches. Fields that are left out are empty,
 * as they are for a singleton an editor has not filled in yet.
 *
 * @param settings - The popular searches of the singleton, or `null` for a missing singleton.
 */
function mockSettings(settings: Partial<PopularSettings> | null): void {
	mockedFetch.mockResolvedValue(
		settings === null ? null : { blockedTerms: null, pinnedTerms: null, title: null, ...settings },
	);
}

/**
 * Numbered terms, so that a list of them keeps its order.
 *
 * @param count - How many terms to create.
 * @returns `Begriff 1` to `Begriff {count}`.
 */
function terms(count: number): string[] {
	return Array.from({ length: count }, (_, index) => `Begriff ${index + 1}`);
}

describe(getPopularSearches, () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('shows the pinned terms under the heading of the singleton', async () => {
		mockSettings({ pinnedTerms: ['Tanzen', 'Probetraining'], title: 'Beliebt' });

		await expect(getPopularSearches()).resolves.toStrictEqual({
			terms: ['Tanzen', 'Probetraining'],
			title: 'Beliebt',
		});
	});

	it('falls back to „Häufig gesucht“ and no terms while the singleton is missing', async () => {
		mockSettings(null);

		await expect(getPopularSearches()).resolves.toStrictEqual({
			terms: [],
			title: 'Häufig gesucht',
		});
	});

	it('falls back to „Häufig gesucht“ for a heading the editors left empty', async () => {
		mockSettings({ pinnedTerms: ['Tanzen'] });

		await expect(getPopularSearches()).resolves.toStrictEqual({
			terms: ['Tanzen'],
			title: 'Häufig gesucht',
		});
	});

	it('falls back to „Häufig gesucht“ for a heading that is only whitespace', async () => {
		mockSettings({ title: '   ' });

		await expect(getPopularSearches()).resolves.toMatchObject({ title: 'Häufig gesucht' });
	});

	it('leaves out a pinned term the editors blocked', async () => {
		mockSettings({ blockedTerms: ['Fußball'], pinnedTerms: ['Tanzen', 'Fußball', 'Turnen'] });

		await expect(getPopularSearches()).resolves.toMatchObject({ terms: ['Tanzen', 'Turnen'] });
	});

	it('compares blocked terms regardless of case and surrounding whitespace', async () => {
		mockSettings({ blockedTerms: ['  fußball '], pinnedTerms: ['Tanzen', 'FUSSBALL', 'Fußball'] });

		await expect(getPopularSearches()).resolves.toMatchObject({ terms: ['Tanzen', 'FUSSBALL'] });
	});

	it('shows at most eight terms', async () => {
		mockSettings({ pinnedTerms: terms(10) });

		const { terms: shown } = await getPopularSearches();

		expect(shown).toHaveLength(POPULAR_SEARCHES_LIMIT);
		expect(shown).toStrictEqual(terms(POPULAR_SEARCHES_LIMIT));
	});

	it('does not spend a place of the eight on a blocked or a repeated term', async () => {
		mockSettings({
			blockedTerms: ['Begriff 2'],
			pinnedTerms: ['Begriff 1', 'begriff 1', 'Begriff 2', ...terms(10).slice(2)],
		});

		const { terms: shown } = await getPopularSearches();

		expect(shown).toStrictEqual(['Begriff 1', ...terms(9).slice(2)]);
	});

	it('shows a term that is pinned in two spellings once, in the first spelling', async () => {
		mockSettings({ pinnedTerms: ['Tanzen', 'tanzen', 'TANZEN'] });

		await expect(getPopularSearches()).resolves.toMatchObject({ terms: ['Tanzen'] });
	});

	it('trims every term and drops the empty ones', async () => {
		mockSettings({ pinnedTerms: ['  Tanzen ', '', '   ', 'Turnen'] });

		await expect(getPopularSearches()).resolves.toMatchObject({ terms: ['Tanzen', 'Turnen'] });
	});

	it('shows no terms for a singleton without pinned terms', async () => {
		mockSettings({ blockedTerms: ['Fußball'], title: 'Beliebt' });

		await expect(getPopularSearches()).resolves.toStrictEqual({ terms: [], title: 'Beliebt' });
	});

	it('reads the published singleton and caches it under the tag searchPage', async () => {
		mockSettings({ pinnedTerms: ['Tanzen'] });

		await getPopularSearches();

		expect(mockedFetch).toHaveBeenCalledExactlyOnceWith(
			searchPopularSettingsQuery,
			{},
			{ next: { revalidate: 3600, tags: ['searchPage'] }, perspective: 'published' },
		);
	});
});
