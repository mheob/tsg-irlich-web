import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import sitemap, { revalidate } from '@/app/sitemap';
import type { client } from '@/lib/sanity/client';
import {
	sitemapDepartmentsQuery,
	sitemapEchoIssuesQuery,
	sitemapFormsQuery,
	sitemapGroupsQuery,
	sitemapNewsArticlesQuery,
	sitemapNewsCategoriesQuery,
} from '@/lib/sanity/queries/sitemap';

import { clientFetchMock } from '../../test-utils/sanity-client-mock';

// The real client validates `NEXT_PUBLIC_SANITY_*` at import time and would talk to the content
// lake; only the query results matter here. The cast names the one method the sitemap uses.
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
const DEPARTMENT = { lastModified: '2026-04-01T10:00:00Z', slug: 'fussball' };
const GROUP = {
	_type: 'group',
	department: 'fussball',
	lastModified: '2026-01-01T10:00:00Z',
	slug: 'herren-1',
};

interface SanityResults {
	articles?: unknown[];
	categories?: unknown[];
	departments?: unknown[];
	echoIssues?: unknown[];
	forms?: unknown[];
	groups?: unknown[];
}

function mockSanity({
	articles = [],
	categories = [],
	departments = [],
	echoIssues = [],
	forms = [],
	groups = [],
}: SanityResults): void {
	// The queries run inside one `Promise.all`, so keying on the query keeps the fixtures
	// readable and independent of the order they resolve in.
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedFetch.mockImplementation(async (query: string) => {
		if (query === sitemapNewsArticlesQuery) return articles;
		if (query === sitemapNewsCategoriesQuery) return categories;
		if (query === sitemapDepartmentsQuery) return departments;
		if (query === sitemapGroupsQuery) return groups;
		if (query === sitemapEchoIssuesQuery) return echoIssues;
		if (query === sitemapFormsQuery) return forms;
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
			'http://localhost:3000/verein/partner',
			'http://localhost:3000/verein/ehrenamt',
			'http://localhost:3000/verein/echo',
			'http://localhost:3000/kontakt',
			'http://localhost:3000/kontakt/feedback',
			'http://localhost:3000/mitgliedschaft',
			'http://localhost:3000/datenschutz',
			'http://localhost:3000/impressum',
			'http://localhost:3000/barrierefreiheit',
		]);
	});

	it('lists the partner page right after the club page, monthly at 0.6', async () => {
		mockSanity({});

		const entries = await sitemap();
		const index = entries.findIndex((entry) => entry.url === 'http://localhost:3000/verein');

		expect(entries[index + 1]).toStrictEqual({
			changeFrequency: 'monthly',
			priority: 0.6,
			url: 'http://localhost:3000/verein/partner',
		});
	});

	it('lists the volunteer page right after the partner page, monthly at 0.6', async () => {
		mockSanity({});

		const entries = await sitemap();
		const index = entries.findIndex(
			(entry) => entry.url === 'http://localhost:3000/verein/partner',
		);

		expect(entries[index + 1]).toStrictEqual({
			changeFrequency: 'monthly',
			priority: 0.6,
			url: 'http://localhost:3000/verein/ehrenamt',
		});
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

	it('lists every department below the offer page', async () => {
		const entries = await urls({
			departments: [
				DEPARTMENT,
				{ lastModified: '2026-04-02T10:00:00Z', slug: 'weitere-sportarten' },
			],
		});

		expect(entries.filter((url) => url.startsWith('http://localhost:3000/angebot/'))).toStrictEqual(
			[
				'http://localhost:3000/angebot/fussball',
				'http://localhost:3000/angebot/weitere-sportarten',
			],
		);
	});

	it('drops a department without a slug', async () => {
		const entries = await urls({ departments: [{ ...DEPARTMENT, slug: null }] });

		expect(entries.some((url) => url.startsWith('http://localhost:3000/angebot/'))).toBe(false);
	});

	it('carries the last modification date of a department as a date', async () => {
		mockSanity({ departments: [DEPARTMENT] });

		const entries = await sitemap();
		const entry = entries.find((candidate) => candidate.url.endsWith('/angebot/fussball'));

		expect(entry?.lastModified).toStrictEqual(new Date('2026-04-01T10:00:00Z'));
	});

	it('puts a group below its department', async () => {
		const entries = await urls({ groups: [GROUP] });

		expect(entries).toContain('http://localhost:3000/angebot/fussball/herren-1');
	});

	it.each([
		['department', { department: null }],
		['slug', { slug: null }],
	])('drops a group without a %s', async (_name, overrides) => {
		const entries = await urls({ groups: [{ ...GROUP, ...overrides }] });

		expect(entries.filter((url) => url.startsWith('http://localhost:3000/angebot/'))).toStrictEqual(
			[],
		);
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

	it('lists a tsg-echo issue below the archive', async () => {
		const entries = await urls({
			echoIssues: [{ lastModified: '2026-10-10T10:00:00Z', slug: 'tsg-echo-2025' }],
		});

		expect(entries).toContain('http://localhost:3000/verein/echo/tsg-echo-2025');
	});

	// Review focus 1: no finished issue, no entry beyond the archive.
	it('lists only the archive without any finished issue', async () => {
		const entries = await urls({ echoIssues: [] });

		expect(entries.filter((url) => url.includes('/verein/echo'))).toStrictEqual([
			'http://localhost:3000/verein/echo',
		]);
	});

	it('lists a form below the registration pages', async () => {
		const entries = await urls({
			forms: [{ lastModified: '2026-11-01T10:00:00Z', slug: 'dorfturnier-2027' }],
		});

		expect(entries).toContain('http://localhost:3000/anmeldung/dorfturnier-2027');
	});

	it('gives a form its change frequency, priority and last modification date', async () => {
		mockSanity({ forms: [{ lastModified: '2026-11-01T10:00:00Z', slug: 'dorfturnier-2027' }] });

		const entries = await sitemap();
		const entry = entries.find((item) => item.url.endsWith('/anmeldung/dorfturnier-2027'));

		expect(entry).toStrictEqual({
			changeFrequency: 'weekly',
			lastModified: new Date('2026-11-01T10:00:00Z'),
			priority: 0.5,
			url: 'http://localhost:3000/anmeldung/dorfturnier-2027',
		});
	});

	it('orders dynamic entries after the static ones', async () => {
		const entries = await urls({
			articles: [ARTICLE],
			categories: [CATEGORY],
			departments: [DEPARTMENT],
			groups: [GROUP],
		});

		expect(entries.slice(-4)).toStrictEqual([
			'http://localhost:3000/angebot/fussball',
			'http://localhost:3000/angebot/fussball/herren-1',
			'http://localhost:3000/news/vereinsleben',
			'http://localhost:3000/news/vereinsleben/sommerfest',
		]);
	});

	// WEB-403: without an interval the build prerenders the sitemap as a static file, which no
	// revalidation reaches; the build log listed it as `○ /sitemap.xml` with no revalidate time.
	it('is regenerated incrementally instead of prerendered once', () => {
		expect(revalidate).toBe(3600);
	});

	// WEB-403: the webhook expires the tag of every document type it is called for, so the hourly
	// regeneration reads these fetches fresh.
	it.each([
		[sitemapNewsArticlesQuery, ['news.article', 'news.category']],
		[sitemapNewsCategoriesQuery, ['news.category']],
		[sitemapDepartmentsQuery, ['department']],
		[sitemapGroupsQuery, ['group', 'department']],
		[sitemapEchoIssuesQuery, ['echo.issue']],
		[sitemapFormsQuery, ['form']],
	])('tags a query with the document types it lists (%#)', async (query, tags) => {
		mockSanity({});

		await sitemap();

		expect(mockedFetch).toHaveBeenCalledWith(query, {}, { next: { tags } });
	});
});
