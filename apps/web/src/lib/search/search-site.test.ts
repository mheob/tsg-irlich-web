import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';
import {
	SEARCH_PAGE_TYPES,
	searchCandidatesQuery,
	searchNewsCountQuery,
	searchNewsQuery,
	searchTextsQuery,
} from '@/lib/sanity/queries/search';
import type { SearchNewsQueryResult, SearchTextsQueryResult } from '@/types/sanity.types';

import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
import { searchSite } from './search-site';
import type { SearchCandidate } from './types';

// The real client validates `NEXT_PUBLIC_SANITY_*` at import time and would talk to the content
// lake. `config` serves the image URL builder, `fetch` the queries.
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

interface SanityResults {
	candidates?: SearchCandidate[];
	news?: NewsArticle[];
	texts?: SearchTextsQueryResult;
}

function mockSanity({ candidates = [], news = [], texts = [] }: SanityResults = {}): void {
	// The queries run inside one `Promise.all`, so keying on the query keeps the fixtures readable
	// and independent of the order they resolve in.
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string, params: Record<string, unknown> = {}) => {
		if (query === searchCandidatesQuery) return candidates;
		if (query === searchNewsQuery) return news.slice(Number(params.start), Number(params.end));
		if (query === searchNewsCountQuery) return news.length;
		if (query === searchTextsQuery) {
			const ids = params.ids as string[];
			return texts.filter((entry) => ids.includes(entry._id));
		}
		throw new Error(`unexpected query: ${query}`);
	});
}

function callsOf(query: string): Record<string, unknown>[] {
	return mockedFetch.mock.calls
		.filter(([called]) => called === query)
		.map(([, params]) => params ?? {});
}

describe(searchSite, () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	// Review focus 1: nothing but operators, punctuation or a single letter.
	it.each(['a', '-', '"', '*', '  ', '..'])('does not search for %j', async (input) => {
		mockSanity();

		await expect(searchSite(input)).resolves.toBeUndefined();
		expect(mockedFetch).not.toHaveBeenCalled();
	});

	it('reads only published content and caches it under the types it shows', async () => {
		mockSanity({ candidates: [group(1)], news: [article(1)] });

		await searchSite('Tanzen');

		const expected = {
			next: { revalidate: 3600, tags: [...SEARCH_PAGE_TYPES, 'news.article', 'news.category'] },
			perspective: 'published',
		};
		expect(mockedFetch.mock.calls.map((call) => call[2])).toStrictEqual([
			expected,
			expected,
			expected,
			expected,
		]);
	});

	it('hands the search term to every search query as the parameter q', async () => {
		mockSanity({ candidates: [group(1)], news: [article(1)] });

		await searchSite('  Tanzen   Diamonds ');

		expect(callsOf(searchCandidatesQuery)).toStrictEqual([{ limit: 100, q: 'tanzen diamonds*' }]);
		expect(callsOf(searchNewsQuery)).toStrictEqual([{ end: 3, q: 'tanzen diamonds*', start: 0 }]);
		expect(callsOf(searchNewsCountQuery)).toStrictEqual([{ q: 'tanzen diamonds*' }]);
		expect(callsOf(searchTextsQuery)).toStrictEqual([{ ids: ['group-1', 'article-1'] }]);
	});

	it('returns the normalized term and its words', async () => {
		mockSanity();

		await expect(searchSite('  Tanzen   Diamonds ')).resolves.toMatchObject({
			query: 'Tanzen Diamonds',
			words: ['tanzen', 'diamonds'],
		});
	});

	it('shows six pages and three news on the „Alle“ tab', async () => {
		mockSanity({ candidates: range(8, group), news: range(5, article) });

		const result = await searchSite('Tanzen');

		expect(result?.pages.map((hit) => hit.id)).toStrictEqual(range(6, (index) => `group-${index}`));
		expect(result?.news.map((hit) => hit.id)).toStrictEqual(
			range(3, (index) => `article-${index}`),
		);
		expect(result?.totals).toStrictEqual({ news: 5, pages: 8 });
	});

	it('pages through the news in steps of ten on the „News“ tab', async () => {
		mockSanity({ candidates: range(4, group), news: range(26, article) });

		const result = await searchSite('Tanzen', { page: 2, tab: 'news' });

		expect(callsOf(searchNewsQuery)).toStrictEqual([{ end: 20, q: 'tanzen*', start: 10 }]);
		expect(result?.news.map((hit) => hit.id)).toStrictEqual(
			range(10, (index) => `article-${index + 10}`),
		);
		expect(result?.pages).toStrictEqual([]);
		expect(result?.totals).toStrictEqual({ news: 26, pages: 4 });
	});

	it('pages through the pages in steps of ten on the „Seiten“ tab, without fetching news', async () => {
		mockSanity({ candidates: range(14, group), news: range(5, article) });

		const result = await searchSite('Tanzen', { page: 2, tab: 'seiten' });

		expect(result?.pages.map((hit) => hit.id)).toStrictEqual(
			range(4, (index) => `group-${index + 10}`),
		);
		expect(result?.news).toStrictEqual([]);
		expect(callsOf(searchNewsQuery)).toStrictEqual([]);
		expect(result?.totals).toStrictEqual({ news: 5, pages: 14 });
	});

	it.each([0, -1, 1.5, Number.NaN])('falls back to the first page for page %s', async (page) => {
		mockSanity({ news: range(12, article) });

		await searchSite('Tanzen', { page, tab: 'news' });

		expect(callsOf(searchNewsQuery)).toStrictEqual([{ end: 10, q: 'tanzen*', start: 0 }]);
	});

	it('returns at most the requested hits per group for the panel, with the full totals', async () => {
		mockSanity({ candidates: range(5, group), news: range(7, article) });

		const result = await searchSite('Tanzen', { perGroup: 3 });

		expect(result?.pages).toHaveLength(3);
		expect(result?.news).toHaveLength(3);
		expect(callsOf(searchNewsQuery)).toStrictEqual([{ end: 3, q: 'tanzen*', start: 0 }]);
		expect(result?.totals).toStrictEqual({ news: 7, pages: 5 });
	});

	it('cuts the snippet from the text around the first match', async () => {
		const long = `${'Vorab ein paar Worte. '.repeat(10)}Beim Tanzen zählt der Spaß. ${'Danach geht es weiter. '.repeat(10)}`;
		mockSanity({
			candidates: [group(1)],
			texts: [{ _id: 'group-1', text: long }],
		});

		const result = await searchSite('Tanzen');

		expect(result?.pages[0].snippet).toMatch(/^….*Beim Tanzen zählt der Spaß\..*…$/u);
	});

	it('leaves a hit without text without a snippet', async () => {
		mockSanity({ candidates: [group(1)], texts: [{ _id: 'group-1', text: null }] });

		const result = await searchSite('Tanzen');

		expect(result?.pages[0].snippet).toBeUndefined();
	});

	it('keeps the snippet of a person or FAQ hit and fetches no text for it', async () => {
		mockSanity({
			candidates: [
				{
					...NO_EXTRAS,
					_id: 'faq-1',
					_score: 4,
					_type: 'faq',
					question: 'Wann ist Tanztraining?',
					slug: null,
					targets: [
						{
							...NO_EXTRAS,
							_id: 'department-tanzen',
							_type: 'department',
							slug: 'tanzen',
							title: 'Tanzen',
						} as unknown as Extract<SearchCandidate, { _type: 'faq' }>['targets'][number],
					],
					title: null,
				},
			],
		});

		const result = await searchSite('Tanztraining');

		expect(result?.pages[0].snippet).toBe('Frage: Wann ist Tanztraining?');
		expect(callsOf(searchTextsQuery)).toStrictEqual([]);
	});

	// Review focus 3: the text of a non-indexable issue must not leak through its snippet.
	it('gives a TSG-Echo issue search engines must not find no snippet', async () => {
		mockSanity({
			candidates: [
				{
					...NO_EXTRAS,
					_id: 'echo-1984',
					_score: 10,
					_type: 'echo.issue',
					indexable: false,
					slug: '1984-1',
					title: 'TSG-Echo 1984',
				},
				group(1),
			],
			texts: [
				{ _id: 'echo-1984', text: 'Ein Text, der nie zu sehen sein darf.' },
				{ _id: 'group-1', text: 'Die Gruppe 1 tanzt.' },
			],
		});

		const result = await searchSite('1984');
		const echo = result?.pages.find((hit) => hit.id === 'echo-1984');

		expect(echo).toBeDefined();
		expect(echo?.snippet).toBeUndefined();
		expect(callsOf(searchTextsQuery)).toStrictEqual([{ ids: ['group-1'] }]);
	});

	it('dates a news hit and names its category', async () => {
		mockSanity({ news: [article(1)] });

		const result = await searchSite('Bericht');

		expect(result?.news[0]).toMatchObject({
			href: '/news/fussball/bericht-1',
			kind: 'news',
			meta: '01.03.2026 · Fußball',
			score: 99,
			title: 'Bericht 1',
		});
	});

	it('drops a news hit without a category, which has no page', async () => {
		mockSanity({ news: [{ ...article(1), category: null }, article(2)] });

		const result = await searchSite('Bericht');

		expect(result?.news.map((hit) => hit.id)).toStrictEqual(['article-2']);
	});

	it('answers an empty result without fetching texts', async () => {
		mockSanity();

		await expect(searchSite('Tanzen')).resolves.toStrictEqual({
			news: [],
			pages: [],
			query: 'Tanzen',
			totals: { news: 0, pages: 0 },
			words: ['tanzen'],
		});
		expect(callsOf(searchTextsQuery)).toStrictEqual([]);
	});
});
