import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';

import NewsCategoryPage, { generateMetadata } from '@/app/news/[category]/page';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { ButtonLink } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import {
	newsArticlesPaginatedForCategoryQuery,
	newsArticlesTotalForCategoryQuery,
	newsOverviewCategoryPageQuery,
} from '@/lib/sanity/queries/pages/news-overview-category';
import { newsCategoryQuery } from '@/lib/sanity/queries/shared/news';

import { findElement } from '../../../../test-utils/react-tree';
import { sanityFetchMock } from '../../../../test-utils/sanity-live-mock';
import { LatestNewsPagination } from '../_sections/latest-news-pagination';
// The open graph helper reaches the real Sanity client through `urlForImage`, and
// `src/lib/sanity/api.ts` asserts its project variables at import time. `vi.hoisted` runs before
// the imports are evaluated; `globalThis` because the `node:process` binding is not initialized
// yet at that point.
vi.hoisted(() => {
	globalThis.process.env.NEXT_PUBLIC_SANITY_DATASET = 'test-dataset';
	globalThis.process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
});

// `defineLive` reads `SANITY_API_READ_TOKEN` at import time and would open a live connection;
// the fetcher is the only binding this route uses.
vi.mock(import('@/lib/sanity/live'), () => ({ sanityFetch: vi.fn() }));

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

const mockedSanityFetch = sanityFetchMock();

const CATEGORY = { meta: undefined, slug: 'vereinsleben', title: 'Vereinsleben' };
const OVERVIEW = {
	content: {
		contactPersonsSection: { title: 'Ansprechpartner' },
		emptyCategoryNotice: 'Hier gibt es noch keine Neuigkeiten.',
	},
	subtitle: 'Alles aus dem Verein',
};

interface NewsResults {
	articles?: null | unknown[];
	category?: unknown;
	page?: unknown;
	total?: number;
}

function mockSanity({
	articles = [],
	category = CATEGORY,
	page = OVERVIEW,
	total = 0,
}: NewsResults = {}): void {
	// The four queries run inside one `Promise.all`, so keying on the query keeps the fixtures
	// independent of the order they resolve in.
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedSanityFetch.mockImplementation(async ({ query }) => {
		if (query === newsOverviewCategoryPageQuery) return { data: page };
		if (query === newsArticlesTotalForCategoryQuery) return { data: total };
		if (query === newsCategoryQuery) return { data: category };
		if (query === newsArticlesPaginatedForCategoryQuery) return { data: articles };
		throw new Error(`unexpected query: ${query}`);
	});
}

function routeProps(seite?: string | string[]): PageProps<'/news/[category]'> {
	// `PageProps<'/news/[category]'>` types both as promises; the route awaits them itself.
	return {
		params: Promise.resolve({ category: 'vereinsleben' }),
		searchParams: Promise.resolve({ seite }),
	};
}

/**
 * Reads the parameters the paginated article query was called with.
 *
 * @returns The parameters of that call, or `undefined` when it never ran.
 */
function paginationParams(): Record<string, unknown> | undefined {
	const call = mockedSanityFetch.mock.calls.find(
		([options]) => (options as { query: string }).query === newsArticlesPaginatedForCategoryQuery,
	);
	return (call?.[0] as { params?: Record<string, unknown> } | undefined)?.params;
}

describe('news category page', () => {
	afterEach(() => {
		mockedSanityFetch.mockReset();
	});

	describe('metadata', () => {
		it('is empty when the category does not exist', async () => {
			mockSanity({ category: null });

			await expect(generateMetadata(routeProps())).resolves.toStrictEqual({});
		});

		it('prefers the meta title and description over the category title', async () => {
			mockSanity({
				category: {
					...CATEGORY,
					meta: { metaDescription: 'Alles aus dem Vereinsleben', metaTitle: 'Vereinsleben · News' },
				},
			});

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Alles aus dem Vereinsleben',
				title: 'Vereinsleben · News',
			});
		});

		it('falls back to the category title and an empty description', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: '',
				openGraph: { images: [] },
				title: 'Vereinsleben',
			});
		});

		it('points the canonical URL at the category, and at the page beyond the first', async () => {
			mockSanity();

			const [firstPage, secondPage] = await Promise.all([
				generateMetadata(routeProps()),
				generateMetadata(routeProps('2')),
			]);

			expect(firstPage.alternates?.canonical).toBe('/news/vereinsleben');
			expect(secondPage.alternates?.canonical).toBe('/news/vereinsleben?seite=2');
		});

		it('looks the category up by its slug without stega encoding', async () => {
			mockSanity();

			await generateMetadata(routeProps());

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { slug: 'vereinsleben' },
				query: newsCategoryQuery,
				stega: false,
			});
		});
	});

	describe('rendering', () => {
		it.each([
			['overview document', { page: null }],
			['category', { category: null }],
		])('gives up without the %s', async (_name, results) => {
			mockSanity(results);

			await expect(NewsCategoryPage(routeProps())).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it.each([
			['page 5 of three articles', '5', 3],
			['page 2 of nine articles', '2', 9],
			['page 2 of an empty category', '2', 0],
		])('answers %s with not found', async (_name, seite, total) => {
			mockSanity({ total });

			await expect(NewsCategoryPage(routeProps(seite))).rejects.toThrow('NEXT_NOT_FOUND');
		});

		it('renders the last page that still holds an article', async () => {
			mockSanity({ articles: [{ _id: 'article-10' }], total: 10 });

			const pagination = findElement(await NewsCategoryPage(routeProps('2')), LatestNewsPagination);

			expect(pagination?.props).toMatchObject({ currentPage: 2, hasNextPage: false });
		});

		it('heads the page with the category title and the overview subtitle', async () => {
			mockSanity();

			const hero = findElement(await NewsCategoryPage(routeProps()), Hero);

			expect(hero?.props).toMatchObject({
				subTitle: 'Alles aus dem Verein',
				title: 'Vereinsleben',
			});
		});

		it('shows the first nine articles on the first page', async () => {
			mockSanity({ articles: [{ _id: 'article-1' }] });

			await NewsCategoryPage(routeProps());

			expect(paginationParams()).toMatchObject({ end: 8, start: 0 });
		});

		it('shifts the window by nine articles per page', async () => {
			mockSanity({ total: 19 });

			await NewsCategoryPage(routeProps('3'));

			expect(paginationParams()).toMatchObject({ end: 26, start: 18 });
		});

		it('reads the page number from the first value of a repeated parameter', async () => {
			mockSanity({ total: 10 });

			await NewsCategoryPage(routeProps(['2', '5']));

			expect(paginationParams()).toMatchObject({ end: 17, start: 9 });
		});

		it.each([['0'], ['-4'], ['keine-zahl']])(
			'falls back to the first page for %s',
			async (seite) => {
				mockSanity();

				await NewsCategoryPage(routeProps(seite));

				expect(paginationParams()).toMatchObject({ end: 8, start: 0 });
			},
		);

		it('offers a next page while articles are left', async () => {
			mockSanity({ articles: [{ _id: 'article-1' }], total: 10 });

			const pagination = findElement(await NewsCategoryPage(routeProps()), LatestNewsPagination);

			expect(pagination?.props).toMatchObject({ currentPage: 1, hasNextPage: true });
		});

		it('offers no next page on the last one', async () => {
			mockSanity({ articles: [{ _id: 'article-1' }], total: 9 });

			const pagination = findElement(await NewsCategoryPage(routeProps()), LatestNewsPagination);

			expect(pagination?.props.hasNextPage).toBe(false);
		});

		it('leaves the pagination out when the article query returned nothing', async () => {
			mockSanity({ articles: null, total: 1 });

			const page = await NewsCategoryPage(routeProps());

			expect(findElement(page, LatestNewsPagination)).toBeUndefined();
		});

		it('explains below the heading that the category has no articles yet', async () => {
			mockSanity({ articles: [], total: 0 });

			const page = await NewsCategoryPage(routeProps());

			expect(findElement(page, SectionHeader)?.props.children).toBe(
				'Hier gibt es noch keine Neuigkeiten.',
			);
			expect(findElement(page, LatestNewsPagination)).toBeUndefined();
		});

		it('links an empty category to all news', async () => {
			mockSanity({ articles: [], total: 0 });

			const link = findElement(await NewsCategoryPage(routeProps()), ButtonLink);

			expect(link?.props.children).toBe('Alle News ansehen');
			expect(link?.props.render).toMatchObject({ props: { href: '/news' } });
		});

		it('lists the contact persons of the overview document', async () => {
			mockSanity();

			const page = await NewsCategoryPage(routeProps());

			expect(findElement(page, ContactPersons)?.props).toMatchObject({
				title: 'Ansprechpartner',
			});
		});
	});
});
