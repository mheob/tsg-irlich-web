import { afterEach, describe, expect, it, vi } from 'vitest';

import NewsOverviewPage, { generateMetadata } from '@/app/news/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { newsOverviewPageQuery } from '@/lib/sanity/queries/pages/news-overview';
import {
	newsArticlesPaginatedQuery,
	newsArticlesQuery,
	newsArticlesTotalQuery,
} from '@/lib/sanity/queries/shared/news';

import { findElement } from '../../../test-utils/react-tree';
import { sanityFetchMock } from '../../../test-utils/sanity-live-mock';
import { LatestNews } from './_sections/latest-news';
import { LatestNewsPagination } from './_sections/latest-news-pagination';
// `src/lib/sanity/api.ts` asserts the project variables at import time, and the page reaches it
// through `urlForImage`. `vi.hoisted` runs before the imports are evaluated; `globalThis` because
// the `node:process` binding is not initialized yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

// `defineLive` reads `SANITY_API_READ_TOKEN` at import time and would open a live connection.
vi.mock(import('@/lib/sanity/live'), () => ({ sanityFetch: vi.fn() }));

const mockedSanityFetch = sanityFetchMock();

const OVERVIEW = {
	content: { contactPersonsSection: { title: 'Ansprechpartner' } },
	meta: undefined,
	subtitle: 'Alles Aktuelle',
	title: 'News',
};

interface OverviewResults {
	articles?: unknown[];
	page?: unknown;
	paginated?: null | unknown[];
	total?: number;
}

function mockSanity({
	articles = [],
	page = OVERVIEW,
	paginated = [],
	total = 0,
}: OverviewResults = {}): void {
	// The four queries run inside one `Promise.all`, so keying on the query keeps the fixtures
	// independent of the order they resolve in.
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedSanityFetch.mockImplementation(async ({ query }) => {
		if (query === newsOverviewPageQuery) return { data: page };
		if (query === newsArticlesTotalQuery) return { data: total };
		if (query === newsArticlesQuery) return { data: articles };
		if (query === newsArticlesPaginatedQuery) return { data: paginated };
		throw new Error(`unexpected query: ${query}`);
	});
}

function routeProps(seite?: string | string[]): PageProps<'/news'> {
	// `PageProps<'/news'>` types the search params as a promise.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return { searchParams: Promise.resolve({ seite }) } as unknown as PageProps<'/news'>;
}

/**
 * Reads the parameters the paginated article query was called with.
 *
 * @returns The parameters of that call, or `undefined` when it never ran.
 */
function paginationParams(): Record<string, unknown> | undefined {
	const call = mockedSanityFetch.mock.calls.find(
		([options]) => (options as { query: string }).query === newsArticlesPaginatedQuery,
	);
	return (call?.[0] as { params?: Record<string, unknown> } | undefined)?.params;
}

describe('news overview page', () => {
	afterEach(() => {
		mockedSanityFetch.mockReset();
	});

	describe('metadata', () => {
		it('is empty when the document is missing', async () => {
			mockSanity({ page: null });

			await expect(generateMetadata()).resolves.toStrictEqual({});
		});

		it('reads the document without stega encoding', async () => {
			mockSanity();

			await generateMetadata();

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				query: newsOverviewPageQuery,
				stega: false,
			});
		});

		it('falls back to the document title and an empty description', async () => {
			mockSanity();

			await expect(generateMetadata()).resolves.toMatchObject({
				description: '',
				openGraph: { images: [] },
				title: 'News',
			});
		});

		it('prefers the meta title and description', async () => {
			mockSanity({
				page: { ...OVERVIEW, meta: { metaDescription: 'Aktuelles', metaTitle: 'News · TSG' } },
			});

			await expect(generateMetadata()).resolves.toMatchObject({
				description: 'Aktuelles',
				title: 'News · TSG',
			});
		});
	});

	describe('rendering', () => {
		it('renders nothing when the document is missing', async () => {
			mockSanity({ page: null });

			await expect(NewsOverviewPage(routeProps())).resolves.toBeNull();
		});

		it('heads the page with its title and subtitle', async () => {
			mockSanity();

			const hero = findElement(await NewsOverviewPage(routeProps()), Hero);

			expect(hero?.props).toMatchObject({ subTitle: 'Alles Aktuelle', title: 'News' });
		});

		it('shows the latest articles above the paginated list', async () => {
			mockSanity({ articles: [{ _id: 'article-1' }] });

			const latest = findElement(await NewsOverviewPage(routeProps()), LatestNews);

			expect(latest?.props.articles).toMatchObject([{ _id: 'article-1' }]);
		});

		it('skips the three articles the latest news section already shows', async () => {
			mockSanity();

			await NewsOverviewPage(routeProps());

			expect(paginationParams()).toMatchObject({ end: 8, start: 3 });
		});

		it('shifts the window by six articles per page', async () => {
			mockSanity();

			await NewsOverviewPage(routeProps('2'));

			expect(paginationParams()).toMatchObject({ end: 14, start: 9 });
		});

		it('reads the page number from the first value of a repeated parameter', async () => {
			mockSanity();

			await NewsOverviewPage(routeProps(['3', '7']));

			expect(paginationParams()).toMatchObject({ end: 20, start: 15 });
		});

		it('offers a next page while articles are left', async () => {
			mockSanity({ paginated: [{ _id: 'article-1' }], total: 10 });

			const pagination = findElement(await NewsOverviewPage(routeProps()), LatestNewsPagination);

			expect(pagination?.props).toMatchObject({ currentPage: 1, hasNextPage: true });
		});

		it('offers no next page on the last one', async () => {
			mockSanity({ paginated: [{ _id: 'article-1' }], total: 9 });

			const pagination = findElement(await NewsOverviewPage(routeProps()), LatestNewsPagination);

			expect(pagination?.props.hasNextPage).toBe(false);
		});

		it('leaves the pagination out when the paginated query returned nothing', async () => {
			mockSanity({ paginated: null });

			const page = await NewsOverviewPage(routeProps());

			expect(findElement(page, LatestNewsPagination)).toBeUndefined();
		});

		it('lists the contact persons of the document', async () => {
			mockSanity();

			const page = await NewsOverviewPage(routeProps());

			expect(findElement(page, ContactPersons)?.props).toMatchObject({
				title: 'Ansprechpartner',
			});
		});
	});
});
