import { afterEach, describe, expect, it, vi } from 'vitest';

import sitemap from '@/app/sitemap';
import type { client } from '@/lib/sanity/client';
import {
	sitemapGroupsQuery,
	sitemapNewsArticlesQuery,
	sitemapNewsCategoriesQuery,
} from '@/lib/sanity/queries/sitemap';

import { clientFetchMock } from '../../test-utils/sanity-client-mock';

// The real client validates `NEXT_PUBLIC_SANITY_*` at import time and would talk to the content
// lake; only the three query results matter here. The cast names the one method the sitemap uses.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

const ARTICLE = {
	category: 'vereinsleben',
	lastModified: '2026-03-01T10:00:00Z',
	slug: 'sommerfest',
};
const CATEGORY = { lastModified: '2026-02-01T10:00:00Z', slug: 'vereinsleben' };
const GROUP = { _type: 'group.soccer', lastModified: '2026-01-01T10:00:00Z', slug: 'herren-1' };

interface SanityResults {
	articles?: unknown[];
	categories?: unknown[];
	groups?: unknown[];
}

function mockSanity({ articles = [], categories = [], groups = [] }: SanityResults): void {
	// The three queries run inside one `Promise.all`, so keying on the query keeps the fixtures
	// readable and independent of the order they resolve in.
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string) => {
		if (query === sitemapNewsArticlesQuery) return articles;
		if (query === sitemapNewsCategoriesQuery) return categories;
		if (query === sitemapGroupsQuery) return groups;
		throw new Error(`unexpected query: ${query}`);
	});
}

async function urls(results: SanityResults = {}): Promise<string[]> {
	mockSanity(results);
	const entries = await sitemap();
	return entries.map((entry) => entry.url);
}

describe(sitemap, () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('lists every static page below the base url', async () => {
		await expect(urls()).resolves.toStrictEqual([
			'http://localhost:3000',
			'http://localhost:3000/angebot',
			'http://localhost:3000/news',
			'http://localhost:3000/verein',
			'http://localhost:3000/kontakt',
			'http://localhost:3000/kontakt/feedback',
			'http://localhost:3000/mitgliedschaft',
			'http://localhost:3000/datenschutz',
			'http://localhost:3000/impressum',
			'http://localhost:3000/barrierefreiheit',
			'http://localhost:3000/angebot/fussball',
			'http://localhost:3000/angebot/kinderturnen',
			'http://localhost:3000/angebot/kurse',
			'http://localhost:3000/angebot/taekwondo',
			'http://localhost:3000/angebot/tanzen',
			'http://localhost:3000/angebot/weitere-sportarten',
		]);
	});

	it('gives the home page the highest priority', async () => {
		mockSanity({});

		const [home] = await sitemap();

		expect(home).toStrictEqual({
			changeFrequency: 'weekly',
			priority: 1,
			url: 'http://localhost:3000',
		});
	});

	it('puts a group below the department its type belongs to', async () => {
		const entries = await urls({ groups: [GROUP] });

		expect(entries).toContain('http://localhost:3000/angebot/fussball/herren-1');
	});

	it('drops a group whose department has no page', async () => {
		const entries = await urls({ groups: [{ ...GROUP, _type: 'group.administration' }] });

		expect(entries.some((url) => url.includes('herren-1'))).toBe(false);
	});

	it('carries the last modification date of a group as a date', async () => {
		mockSanity({ groups: [GROUP] });

		const entries = await sitemap();
		const entry = entries.find((candidate) => candidate.url.endsWith('herren-1'));

		expect(entry?.lastModified).toStrictEqual(new Date('2026-01-01T10:00:00Z'));
	});

	it('leaves the last modification date off a group that has none', async () => {
		mockSanity({ groups: [{ ...GROUP, lastModified: null }] });

		const entries = await sitemap();
		const entry = entries.find((candidate) => candidate.url.endsWith('herren-1'));

		expect(entry?.lastModified).toBeUndefined();
	});

	it('lists a news category below the news overview', async () => {
		const entries = await urls({ categories: [CATEGORY] });

		expect(entries).toContain('http://localhost:3000/news/vereinsleben');
	});

	it('drops a news category without a slug', async () => {
		const entries = await urls({ categories: [{ ...CATEGORY, slug: null }] });

		expect(entries.some((url) => url.startsWith('http://localhost:3000/news/'))).toBe(false);
	});

	it('lists a news article below its category', async () => {
		const entries = await urls({ articles: [ARTICLE] });

		expect(entries).toContain('http://localhost:3000/news/vereinsleben/sommerfest');
	});

	it.each([
		['slug', { slug: null }],
		['category', { category: null }],
	])('drops a news article without a %s', async (_name, overrides) => {
		const entries = await urls({ articles: [{ ...ARTICLE, ...overrides }] });

		expect(entries.some((url) => url.includes('sommerfest'))).toBe(false);
	});

	it('orders dynamic entries after the static ones', async () => {
		const entries = await urls({ articles: [ARTICLE], categories: [CATEGORY], groups: [GROUP] });

		expect(entries.slice(-3)).toStrictEqual([
			'http://localhost:3000/angebot/fussball/herren-1',
			'http://localhost:3000/news/vereinsleben',
			'http://localhost:3000/news/vereinsleben/sommerfest',
		]);
	});
});
