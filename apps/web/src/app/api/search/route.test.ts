import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { GET } from '@/app/api/search/route';
import type { client } from '@/lib/sanity/client';
import {
	searchCandidatesQuery,
	searchNewsCountQuery,
	searchNewsQuery,
	searchTextsQuery,
} from '@/lib/sanity/queries/search';
import type { SearchCandidate, SearchResult } from '@/lib/search/types';
import type { SearchNewsQueryResult } from '@/types/sanity.types';

import { clientFetchMock } from '../../../../test-utils/sanity-client-mock';

// The real client validates `NEXT_PUBLIC_SANITY_*` at import time and would talk to the content
// lake. `config` serves the image URL builder, `fetch` the queries. The route is checked at this
// boundary rather than with a mocked `searchSite`, so "no query" means that nothing reaches Sanity.
vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
		fetch: vi.fn(),
	} as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

type NewsArticle = SearchNewsQueryResult[number];

const NO_EXTRAS = {
	category: null,
	department: null,
	image: null,
	indexable: null,
	publishedAt: null,
};

/**
 * A group page as a candidate, numbered so that a list of them keeps its order.
 *
 * @param index - The position of the group, from 1.
 * @returns The candidate, its score falling with its position.
 */
function group(index: number): SearchCandidate {
	return {
		...NO_EXTRAS,
		_id: `group-${index}`,
		_score: 100 - index,
		_type: 'group',
		department: { slug: 'tanzen', title: 'Tanzen' },
		slug: `gruppe-${index}`,
		title: `Gruppe ${index}`,
	};
}

/**
 * A news article as the news query returns it.
 *
 * @param index - The position of the article, from 1.
 * @returns The article.
 */
function article(index: number): NewsArticle {
	return {
		...NO_EXTRAS,
		_id: `article-${index}`,
		_score: 100 - index,
		_type: 'news.article',
		category: { slug: 'fussball', title: 'Fußball' },
		publishedAt: '2026-03-01T12:00:00Z',
		slug: `bericht-${index}`,
		title: `Bericht ${index}`,
	};
}

function range<T>(count: number, create: (index: number) => T): T[] {
	return Array.from({ length: count }, (_, index) => create(index + 1));
}

function mockSanity(candidates: SearchCandidate[], news: NewsArticle[]): void {
	// The queries run inside one `Promise.all`, so keying on the query keeps the fixtures independent
	// of the order they resolve in.
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string, params: Record<string, unknown> = {}) => {
		if (query === searchCandidatesQuery) return candidates;
		if (query === searchNewsQuery) return news.slice(Number(params.start), Number(params.end));
		if (query === searchNewsCountQuery) return news.length;
		if (query === searchTextsQuery) return [];
		throw new Error(`unexpected query: ${query}`);
	});
}

function requestFor(search: string): NextRequest {
	return new NextRequest(`http://localhost:3000/api/search${search}`);
}

describe('search route', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	// Review focus 1: nothing but operators, punctuation or a single letter. The panel then shows
	// „Häufig gesucht“, so the answer is `null`, and no query reaches Sanity.
	it.each(['', '?q=', '?q=a', '?q=-', '?q=%22', '?q=*', '?q=%20%20', '?q=..'])(
		'answers null without searching for %j',
		async (search) => {
			mockSanity([group(1)], [article(1)]);

			const response = await GET(requestFor(search));

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toBeNull();
			expect(mockedFetch).not.toHaveBeenCalled();
		},
	);

	it('answers the result of the search as JSON', async () => {
		mockSanity([group(1)], [article(1)]);

		const response = await GET(requestFor('?q=Tanzen'));

		expect(response.status).toBe(200);
		const result = (await response.json()) as SearchResult;
		expect(result.query).toBe('Tanzen');
		expect(result.totals).toStrictEqual({ news: 1, pages: 1 });
		expect(result.pages).toMatchObject([
			{ href: '/angebot/tanzen/gruppe-1', kind: 'group', title: 'Gruppe 1' },
		]);
		expect(result.news).toMatchObject([
			{ href: '/news/fussball/bericht-1', kind: 'news', title: 'Bericht 1' },
		]);
	});

	it('answers at most three hits per group and the totals of both', async () => {
		mockSanity(range(5, group), range(4, article));

		const response = await GET(requestFor('?q=Tanzen'));
		const result = (await response.json()) as SearchResult;

		expect(result.pages.map(({ title }) => title)).toStrictEqual([
			'Gruppe 1',
			'Gruppe 2',
			'Gruppe 3',
		]);
		expect(result.news.map(({ title }) => title)).toStrictEqual([
			'Bericht 1',
			'Bericht 2',
			'Bericht 3',
		]);
		expect(result.totals).toStrictEqual({ news: 4, pages: 5 });
	});

	it('reads the search term decoded and as the search reads it', async () => {
		mockSanity([group(1)], []);

		const response = await GET(requestFor('?q=%20Tanzen+%20Diamonds%20'));
		const result = (await response.json()) as SearchResult | null;

		expect(result?.query).toBe('Tanzen Diamonds');
	});

	it('answers a search without hits with empty groups, not null', async () => {
		mockSanity([], []);

		const response = await GET(requestFor('?q=Zumba'));

		await expect(response.json()).resolves.toMatchObject({
			news: [],
			pages: [],
			query: 'Zumba',
			totals: { news: 0, pages: 0 },
		});
	});
});
