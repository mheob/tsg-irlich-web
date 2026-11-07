import { notFound, permanentRedirect } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { ButtonLink } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { newsOverviewHeroImageQuery } from '@/lib/sanity/queries/pages/news-overview';
import {
	newsArticlesPaginatedForCategoryQuery,
	newsArticlesTotalForCategoryQuery,
	newsOverviewCategoryPageQuery,
} from '@/lib/sanity/queries/pages/news-overview-category';
import {
	newsCategoriesQuery,
	newsCategoryQuery,
	newsCategoryRedirectQuery,
} from '@/lib/sanity/queries/shared/news';

import { META_OPEN_GRAPH_IMAGE, PAGE_HERO_IMAGE } from '../../../../test-utils/page-images';
import { findElement } from '../../../../test-utils/react-tree';
import { sanityFetchMock } from '../../../../test-utils/sanity-live-mock';
import { CategoryCombobox } from '../_sections/category-combobox';
import { LatestNewsPagination } from '../_sections/latest-news-pagination';
import { NewsCategory } from './news-category';
import { getNewsCategoryMetadata } from './news-category-metadata';
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
	permanentRedirect: vi.fn(() => {
		throw new Error('NEXT_REDIRECT');
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
const CATEGORIES = {
	categories: [{ articleCount: 12, slug: 'vereinsleben', title: 'Vereinsleben' }],
	total: 95,
};

interface NewsResults {
	articles?: null | unknown[];
	categories?: unknown;
	category?: unknown;
	page?: unknown;
	redirect?: null | string;
	total?: number;
}

function mockSanity({
	articles = [],
	categories = CATEGORIES,
	category = CATEGORY,
	page = OVERVIEW,
	redirect = null,
	total = 0,
}: NewsResults = {}): void {
	// The queries run inside one `Promise.all`, so keying on the query keeps the fixtures
	// independent of the order they resolve in.
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedSanityFetch.mockImplementation(async ({ query }) => {
		if (query === newsOverviewCategoryPageQuery) return { data: page };
		if (query === newsOverviewHeroImageQuery) return { data: PAGE_HERO_IMAGE };
		if (query === newsArticlesTotalForCategoryQuery) return { data: total };
		if (query === newsCategoryQuery) return { data: category };
		if (query === newsCategoriesQuery) return { data: categories };
		if (query === newsArticlesPaginatedForCategoryQuery) return { data: articles };
		if (query === newsCategoryRedirectQuery) return { data: redirect };
		throw new Error(`unexpected query: ${query}`);
	});
}

/**
 * The props of a page of the category `vereinsleben`.
 *
 * @param currentPage - The page shown.
 * @returns The props.
 */
function categoryPage(currentPage = 1): { categoryParameter: string; currentPage: number } {
	return { categoryParameter: 'vereinsleben', currentPage };
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

describe('news category', () => {
	afterEach(() => {
		mockedSanityFetch.mockReset();
		vi.mocked(notFound).mockClear();
		vi.mocked(permanentRedirect).mockClear();
	});

	describe('metadata', () => {
		it('is empty when the category does not exist', async () => {
			mockSanity({ category: null });

			await expect(getNewsCategoryMetadata('vereinsleben', 1)).resolves.toStrictEqual({});
		});

		it('shares the hero image of the news overview as preview image', async () => {
			mockSanity();

			const metadata = await getNewsCategoryMetadata('vereinsleben', 1);
			const openGraphImage = metadata.openGraph?.images as undefined | { url?: string };

			expect(openGraphImage?.url).toContain('heroimg111');
		});

		it('prefers the open graph image of the category over the hero image', async () => {
			mockSanity({ category: { ...CATEGORY, meta: { openGraphImage: META_OPEN_GRAPH_IMAGE } } });

			const metadata = await getNewsCategoryMetadata('vereinsleben', 1);
			const openGraphImage = metadata.openGraph?.images as undefined | { url?: string };

			expect(openGraphImage?.url).toContain('ogimg222');
		});

		it('prefers the meta title and description over the category title', async () => {
			mockSanity({
				category: {
					...CATEGORY,
					meta: { metaDescription: 'Alles aus dem Vereinsleben', metaTitle: 'Vereinsleben · News' },
				},
			});

			await expect(getNewsCategoryMetadata('vereinsleben', 1)).resolves.toMatchObject({
				description: 'Alles aus dem Vereinsleben',
				title: 'Vereinsleben · News',
			});
		});

		it('falls back to the category title and an empty description', async () => {
			mockSanity();

			await expect(getNewsCategoryMetadata('vereinsleben', 1)).resolves.toMatchObject({
				description: '',
				title: 'Vereinsleben',
			});
		});

		it('points the canonical URL at the category, and at the page beyond the first', async () => {
			mockSanity();

			const [firstPage, secondPage] = await Promise.all([
				getNewsCategoryMetadata('vereinsleben', 1),
				getNewsCategoryMetadata('vereinsleben', 2),
			]);

			expect(firstPage.alternates?.canonical).toBe('/news/vereinsleben');
			expect(secondPage.alternates?.canonical).toBe('/news/vereinsleben?seite=2');
		});

		it('looks the category up by its slug without stega encoding', async () => {
			mockSanity();

			await getNewsCategoryMetadata('vereinsleben', 1);

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

			await expect(NewsCategory(categoryPage())).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('looks up nothing in the slug histories when only the overview document is missing', async () => {
			mockSanity({ page: null });

			await expect(NewsCategory(categoryPage())).rejects.toThrow('NEXT_NOT_FOUND');
			expect(mockedSanityFetch.mock.calls.map(([options]) => options.query)).not.toContain(
				newsCategoryRedirectQuery,
			);
		});

		// WEB-421: a renamed category broke the links to it.
		describe('under a former slug', () => {
			it('redirects to the category that used to have the slug', async () => {
				mockSanity({ category: null, redirect: 'vereinsleben-neu' });

				await expect(NewsCategory(categoryPage())).rejects.toThrow('NEXT_REDIRECT');
				expect(vi.mocked(permanentRedirect)).toHaveBeenCalledExactlyOnceWith(
					'/news/vereinsleben-neu',
				);
			});

			it('keeps a later page under its public address', async () => {
				mockSanity({ category: null, redirect: 'vereinsleben-neu' });

				await expect(NewsCategory(categoryPage(3))).rejects.toThrow('NEXT_REDIRECT');
				expect(vi.mocked(permanentRedirect)).toHaveBeenCalledExactlyOnceWith(
					'/news/vereinsleben-neu?seite=3',
				);
			});

			it('looks the slug up in the histories without stega encoding', async () => {
				mockSanity({ category: null, redirect: 'vereinsleben-neu' });

				await expect(NewsCategory(categoryPage())).rejects.toThrow('NEXT_REDIRECT');
				expect(mockedSanityFetch).toHaveBeenCalledWith({
					params: { slug: 'vereinsleben' },
					query: newsCategoryRedirectQuery,
					stega: false,
				});
			});

			it('is not found when no category ever had the slug', async () => {
				mockSanity({ category: null });

				await expect(NewsCategory(categoryPage(2))).rejects.toThrow('NEXT_NOT_FOUND');
				expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
			});
		});

		it.each([
			['page 5 of three articles', 5, 3],
			['page 2 of nine articles', 2, 9],
			['page 2 of an empty category', 2, 0],
		])('answers %s with not found', async (_name, currentPage, total) => {
			mockSanity({ total });

			await expect(NewsCategory(categoryPage(currentPage))).rejects.toThrow('NEXT_NOT_FOUND');
		});

		it('renders the last page that still holds an article', async () => {
			mockSanity({ articles: [{ _id: 'article-10' }], total: 10 });

			const pagination = findElement(await NewsCategory(categoryPage(2)), LatestNewsPagination);

			expect(pagination?.props).toMatchObject({ currentPage: 2, totalArticles: 10 });
		});

		it('shows the hero image of the news overview', async () => {
			mockSanity();

			const hero = findElement(await NewsCategory(categoryPage()), Hero);

			expect(hero?.props.image?.alt).toBe('Hero der Seite');
			expect(hero?.props.image?.src).toContain('heroimg111');
		});

		it('heads the page with the category title and the overview subtitle', async () => {
			mockSanity();

			const hero = findElement(await NewsCategory(categoryPage()), Hero);

			expect(hero?.props).toMatchObject({
				subTitle: 'Alles aus dem Verein',
				title: 'Vereinsleben',
			});
		});

		it('offers every category next to the heading, with the current one selected', async () => {
			mockSanity();

			const combobox = findElement(await NewsCategory(categoryPage()), CategoryCombobox);

			expect(combobox?.props).toMatchObject({ ...CATEGORIES, currentSlug: 'vereinsleben' });
		});

		it('asks for the categories including the current one, even when it is empty', async () => {
			mockSanity();

			await NewsCategory(categoryPage());

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { current: 'vereinsleben' },
				query: newsCategoriesQuery,
			});
		});

		it('shows the first nine articles on the first page', async () => {
			mockSanity({ articles: [{ _id: 'article-1' }] });

			await NewsCategory(categoryPage());

			expect(paginationParams()).toMatchObject({ end: 8, start: 0 });
		});

		it('shifts the window by nine articles per page', async () => {
			mockSanity({ total: 19 });

			await NewsCategory(categoryPage(3));

			expect(paginationParams()).toMatchObject({ end: 26, start: 18 });
		});

		it('paginates the category below its own path by nine articles', async () => {
			mockSanity({ articles: [{ _id: 'article-1' }], total: 10 });

			const pagination = findElement(await NewsCategory(categoryPage()), LatestNewsPagination);

			expect(pagination?.props).toMatchObject({
				basePath: '/news/vereinsleben',
				currentPage: 1,
				perPage: 9,
				startIndex: 0,
				totalArticles: 10,
			});
		});

		it('leaves the pagination out when the article query returned nothing', async () => {
			mockSanity({ articles: null, total: 1 });

			const page = await NewsCategory(categoryPage());

			expect(findElement(page, LatestNewsPagination)).toBeUndefined();
		});

		it('explains below the heading that the category has no articles yet', async () => {
			mockSanity({ articles: [], total: 0 });

			const page = await NewsCategory(categoryPage());

			expect(findElement(page, SectionHeader)?.props.children).toBe(
				'Hier gibt es noch keine Neuigkeiten.',
			);
			expect(findElement(page, LatestNewsPagination)).toBeUndefined();
		});

		it('links an empty category to all news', async () => {
			mockSanity({ articles: [], total: 0 });

			const link = findElement(await NewsCategory(categoryPage()), ButtonLink);

			expect(link?.props.children).toBe('Alle News ansehen');
			expect(link?.props.render).toMatchObject({ props: { href: '/news' } });
		});

		it('lists the contact persons of the overview document', async () => {
			mockSanity();

			const page = await NewsCategory(categoryPage());

			expect(findElement(page, ContactPersons)?.props).toMatchObject({
				title: 'Ansprechpartner',
			});
		});
	});
});
