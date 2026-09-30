import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import NewsOverviewPage, { generateMetadata } from '@/app/news/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { newsOverviewPageQuery } from '@/lib/sanity/queries/pages/news-overview';
import {
	newsArticlesPaginatedQuery,
	newsArticlesQuery,
	newsArticlesTotalQuery,
	newsCategoriesQuery,
} from '@/lib/sanity/queries/shared/news';

import { findElement } from '../../../test-utils/react-tree';
import { sanityFetchMock } from '../../../test-utils/sanity-live-mock';
import { CategoryCombobox } from './_sections/category-combobox';
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

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

const mockedSanityFetch = sanityFetchMock();

const OVERVIEW = {
	content: { contactPersonsSection: { title: 'Ansprechpartner' } },
	meta: undefined,
	subtitle: 'Alles Aktuelle',
	title: 'News',
};
const CATEGORIES = {
	categories: [{ articleCount: 71, slug: 'fussball', title: 'Fußball' }],
	total: 95,
};

interface OverviewResults {
	articles?: unknown[];
	categories?: unknown;
	page?: unknown;
	paginated?: null | unknown[];
	total?: number;
}

function mockSanity({
	articles = [],
	categories = CATEGORIES,
	page = OVERVIEW,
	paginated = [],
	total = 0,
}: OverviewResults = {}): void {
	// The queries run inside one `Promise.all`, so keying on the query keeps the fixtures
	// independent of the order they resolve in.
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedSanityFetch.mockImplementation(async ({ query }) => {
		if (query === newsOverviewPageQuery) return { data: page };
		if (query === newsCategoriesQuery) return { data: categories };
		if (query === newsArticlesTotalQuery) return { data: total };
		if (query === newsArticlesQuery) return { data: articles };
		if (query === newsArticlesPaginatedQuery) return { data: paginated };
		throw new Error(`unexpected query: ${query}`);
	});
}

function routeProps(seite?: string | string[]): PageProps<'/news'> {
	// `PageProps<'/news'>` types the search params as a promise.
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

			await expect(generateMetadata(routeProps())).resolves.toStrictEqual({});
		});

		it('reads the document without stega encoding', async () => {
			mockSanity();

			await generateMetadata(routeProps());

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				query: newsOverviewPageQuery,
				stega: false,
			});
		});

		it('falls back to the document title and an empty description', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: '',
				openGraph: { images: [] },
				title: 'News',
			});
		});

		it('prefers the meta title and description', async () => {
			mockSanity({
				page: { ...OVERVIEW, meta: { metaDescription: 'Aktuelles', metaTitle: 'News · TSG' } },
			});

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Aktuelles',
				title: 'News · TSG',
			});
		});

		it('points the canonical URL of the first page at the plain overview', async () => {
			mockSanity();

			const metadata = await generateMetadata(routeProps('1'));

			expect(metadata.alternates?.canonical).toBe('/news');
		});

		it('points the canonical URL of every later page at that page', async () => {
			mockSanity();

			const metadata = await generateMetadata(routeProps('2'));

			expect(metadata.alternates?.canonical).toBe('/news?seite=2');
			expect(metadata.openGraph).toMatchObject({ url: '/news?seite=2' });
		});
	});

	describe('rendering', () => {
		it('renders nothing when the document is missing', async () => {
			mockSanity({ page: null });

			await expect(NewsOverviewPage(routeProps())).resolves.toBeNull();
		});

		it.each([
			['page 2 of nine articles', '2', 9],
			['page 5 of twenty articles', '5', 20],
			['page 2 without any article', '2', 0],
		])('answers %s with not found', async (_name, seite, total) => {
			mockSanity({ total });

			await expect(NewsOverviewPage(routeProps(seite))).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('renders the last page that still holds an article', async () => {
			mockSanity({ paginated: [{ _id: 'article-10' }], total: 10 });

			const pagination = findElement(await NewsOverviewPage(routeProps('2')), LatestNewsPagination);

			expect(pagination?.props).toMatchObject({ currentPage: 2, hasNextPage: false });
		});

		it('heads the page with its title and subtitle', async () => {
			mockSanity();

			const hero = findElement(await NewsOverviewPage(routeProps()), Hero);

			expect(hero?.props).toMatchObject({ subTitle: 'Alles Aktuelle', title: 'News' });
		});

		it('offers every category next to the heading, with all news selected', async () => {
			mockSanity();

			const combobox = findElement(await NewsOverviewPage(routeProps()), CategoryCombobox);

			expect(combobox?.props).toMatchObject(CATEGORIES);
			expect(combobox?.props.currentSlug).toBeUndefined();
		});

		it('asks for the categories without a current one', async () => {
			mockSanity();

			await NewsOverviewPage(routeProps());

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { current: '' },
				query: newsCategoriesQuery,
			});
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
			mockSanity({ total: 10 });

			await NewsOverviewPage(routeProps('2'));

			expect(paginationParams()).toMatchObject({ end: 14, start: 9 });
		});

		it('reads the page number from the first value of a repeated parameter', async () => {
			mockSanity({ total: 16 });

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
