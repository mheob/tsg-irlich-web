import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { GET } from '@/app/feed.xml/route';
import type { client } from '@/lib/sanity/client';

import { clientFetchMock } from '../../../test-utils/sanity-client-mock';

// The preview images go through `urlForSharedImage`, which reaches `src/lib/sanity/api.ts`, and that
// asserts its project variables at import time. `vi.hoisted` runs before the imports are evaluated.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

const ARTICLE = {
	author: { firstName: 'Ada', lastName: 'Lovelace' },
	category: 'vereinsleben',
	categoryTitle: 'Vereinsleben',
	excerpt: 'Ein Rückblick auf das Sommerfest.',
	publishedAt: '2026-07-01T08:00:00Z',
	slug: 'sommerfest',
	title: 'Sommerfest 2026',
};

async function feed(articles: unknown[] = [ARTICLE]): Promise<string> {
	mockedFetch.mockResolvedValue(articles);
	const response = await GET();
	return response.text();
}

describe('rss feed', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	it('is served as xml that clients may cache for an hour', async () => {
		mockedFetch.mockResolvedValue([]);

		const response = await GET();

		expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
		expect(response.headers.get('cache-control')).toBe('public, max-age=3600, s-maxage=3600');
	});

	it('describes the channel and points back at itself', async () => {
		const xml = await feed([]);

		expect(xml).toContain('<title>TSG Irlich — News</title>');
		expect(xml).toContain('<link>http://localhost:3000/news</link>');
		expect(xml).toContain('<language>de-DE</language>');
		expect(xml).toContain(
			'<atom:link href="http://localhost:3000/feed.xml" rel="self" type="application/rss+xml"/>',
		);
		expect(xml).toContain('<url>http://localhost:3000/icon-512.png</url>');
	});

	it('renders an article as an item below its category', async () => {
		const xml = await feed();

		expect(xml).toContain('<title><![CDATA[Sommerfest 2026]]></title>');
		expect(xml).toContain('<link>http://localhost:3000/news/vereinsleben/sommerfest</link>');
		expect(xml).toContain(
			'<guid isPermaLink="true">http://localhost:3000/news/vereinsleben/sommerfest</guid>',
		);
		expect(xml).toContain(
			'<description><![CDATA[Ein Rückblick auf das Sommerfest.]]></description>',
		);
	});

	it('formats the publication date as an rfc 822 date', async () => {
		const xml = await feed();

		expect(xml).toContain('<pubDate>Wed, 01 Jul 2026 08:00:00 GMT</pubDate>');
	});

	it('names the author without an email address', async () => {
		const xml = await feed();

		expect(xml).toContain('<dc:creator><![CDATA[Ada Lovelace]]></dc:creator>');
		expect(xml).not.toContain('<author>');
		expect(xml).not.toContain('@');
	});

	it('attaches the preview image as a 16:9 JPEG', async () => {
		const xml = await feed([
			{
				...ARTICLE,
				featuredImage: { asset: { _ref: 'image-abc123def456-1600x900-jpg', _type: 'reference' } },
			},
		]);

		expect(xml).toMatch(
			/<media:content url="https:\/\/cdn\.sanity\.io\/images\/test-project\/test-dataset\/abc123def456-1600x900\.jpg\?[^"]*fm=jpg[^"]*" medium="image" type="image\/jpeg" width="1200" height="675"\/>/u,
		);
		expect(xml).not.toMatch(/url="[^"]*&(?!amp;)/u);
	});

	it('leaves the image out when the article has none', async () => {
		const xml = await feed();

		expect(xml).not.toContain('<media:content');
	});

	it('declares the namespaces of the creator and the image', async () => {
		const xml = await feed([]);

		expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
		expect(xml).toContain('xmlns:media="http://search.yahoo.com/mrss/"');
	});

	it('adds the category when the article has one', async () => {
		const xml = await feed();

		expect(xml).toContain('<category><![CDATA[Vereinsleben]]></category>');
	});

	it('leaves the category element out when the article has no category title', async () => {
		const xml = await feed([{ ...ARTICLE, categoryTitle: null }]);

		expect(xml).not.toContain('<category>');
	});

	it.each([
		['slug', { slug: null }],
		['category', { category: null }],
	])('skips an article without a %s', async (_name, overrides) => {
		const xml = await feed([{ ...ARTICLE, ...overrides }]);

		expect(xml).not.toContain('<item>');
	});

	it('renders one item per article', async () => {
		const xml = await feed([ARTICLE, { ...ARTICLE, slug: 'winterfeier', title: 'Winterfeier' }]);

		expect(xml.match(/<item>/gu)).toHaveLength(2);
	});
});
