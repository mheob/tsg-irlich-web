import { notFound, permanentRedirect } from 'next/navigation';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import NewsArticlePage, {
	generateMetadata,
	generateStaticParams,
} from '@/app/news/[category]/[slug]/page';
import { Hero } from '@/components/section/hero';
import { Gallery } from '@/components/ui/gallery';
import { JsonLd } from '@/components/ui/json-ld';
import { LightboxGallery } from '@/components/ui/lightbox';
import { PortableText } from '@/components/ui/portable-text';
import { Separator } from '@/components/ui/separator';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import {
	newsArticleContentQuery,
	newsArticleHeroQuery,
	newsArticleRedirectQuery,
} from '@/lib/sanity/queries/pages/news-article';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import { sponsorsQuery } from '@/lib/sanity/queries/shared/sponsors';

import { findElement, findElements, sectionTypes } from '../../../../../test-utils/react-tree';
import { sanityFetchMock } from '../../../../../test-utils/sanity-live-mock';
import { encodeLikeDraftMode } from '../../../../../test-utils/stega';
import { Downloads } from './_sections/downloads';
import { Sponsors } from './_sections/sponsors';
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
	permanentRedirect: vi.fn(() => {
		throw new Error('NEXT_REDIRECT');
	}),
}));

const mockedSanityFetch = sanityFetchMock();

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const ASSET_REF = 'image-abc123def456-800x600-jpg';

function imageBlock(key: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		_key: key,
		_type: 'mainImage',
		alt: `Bild ${key}`,
		asset: { _ref: ASSET_REF, _type: 'reference' },
		...overrides,
	};
}

const HERO = { subtitle: 'Aktuelles', title: 'News' };
const CATEGORY_DOCUMENT = { _id: 'category-vereinsleben', _type: 'news.category' };
const ARTICLE = {
	categories: [{ slug: 'vereinsleben', title: 'Vereinsleben' }],
	excerpt: 'Ein Rückblick auf das Sommerfest.',
	featuredImage: { alt: 'Das Sommerfest', asset: { _ref: ASSET_REF, _type: 'reference' } },
	slug: 'sommerfest',
	title: 'Sommerfest 2026',
};

interface ArticleResults {
	article?: unknown;
	hero?: unknown;
	redirect?: unknown;
	socialMedia?: unknown;
	sponsors?: null | unknown[];
}

function mockSanity({
	article = ARTICLE,
	hero = HERO,
	redirect = null,
	socialMedia = { instagram: 'https://instagram.example' },
	sponsors = [],
}: ArticleResults = {}): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedSanityFetch.mockImplementation(async ({ query }) => {
		if (query === newsArticleHeroQuery) return { data: hero };
		if (query === newsArticleContentQuery) return { data: article };
		if (query === newsArticleRedirectQuery) return { data: redirect };
		if (query === socialMediaQuery) return { data: socialMedia };
		if (query === sponsorsQuery) return { data: sponsors };
		throw new Error(`unexpected query: ${query}`);
	});
}

function queriesSent(): unknown[] {
	return mockedSanityFetch.mock.calls.map(([options]) => options.query);
}

function routeProps(): PageProps<'/news/[category]/[slug]'> {
	// `PageProps<'/news/[category]/[slug]'>` types the params as a promise.
	return {
		params: Promise.resolve({ category: 'vereinsleben', slug: 'sommerfest' }),
	} as unknown as PageProps<'/news/[category]/[slug]'>;
}

function articleElement(page: ReactNode): ReactElement<{ children?: ReactNode }> {
	const article = findElement<{ children?: ReactNode }>(page, 'article');
	if (!article) {
		throw new Error('Expected the page to render an article element.');
	}
	return article;
}

async function renderWithBody(body: unknown[]): Promise<ReactNode> {
	mockSanity({ article: { ...ARTICLE, body } });
	return NewsArticlePage(routeProps());
}

describe('news article page', () => {
	afterEach(() => {
		mockedSanityFetch.mockReset();
		vi.mocked(notFound).mockClear();
		vi.mocked(permanentRedirect).mockClear();
	});

	// WEB-415: without the list the route rendered on every request.
	it('prerenders no article at build time, so every article is cached on its first request', () => {
		expect(generateStaticParams()).toStrictEqual([]);
	});

	describe('metadata', () => {
		it('is empty when the article does not exist', async () => {
			mockSanity({ article: null });

			await expect(generateMetadata(routeProps())).resolves.toStrictEqual({});
		});

		it('describes the article with its excerpt when no meta description is set', async () => {
			mockSanity();

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Ein Rückblick auf das Sommerfest.',
				title: 'Sommerfest 2026',
			});
		});

		it('prefers the meta fields over excerpt and title', async () => {
			mockSanity({
				article: {
					...ARTICLE,
					meta: { metaDescription: 'Kurzfassung', metaTitle: 'Sommerfest im Rückblick' },
				},
			});

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Kurzfassung',
				title: 'Sommerfest im Rückblick',
			});
		});

		it('falls back to the featured image for the open graph image', async () => {
			mockSanity();

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph?.images).toMatchObject({ alt: 'Das Sommerfest' });
		});

		it('has no open graph image when the article carries none', async () => {
			mockSanity({ article: { ...ARTICLE, featuredImage: null } });

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph?.images).toStrictEqual([]);
		});

		it('describes the article as one, with its author and dates', async () => {
			mockSanity({
				article: {
					...ARTICLE,
					_updatedAt: '2026-06-03T08:00:00Z',
					author: { firstName: 'Erika', lastName: 'Mustermann' },
					publishedAt: '2026-06-01T18:00:00Z',
				},
			});

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph).toMatchObject({
				authors: ['Erika Mustermann'],
				modifiedTime: '2026-06-03T08:00:00Z',
				publishedTime: '2026-06-01T18:00:00Z',
				type: 'article',
			});
		});

		it('never dates the last change before the publication', async () => {
			mockSanity({
				article: {
					...ARTICLE,
					_updatedAt: '2026-05-28T08:00:00Z',
					publishedAt: '2026-06-01T18:00:00Z',
				},
			});

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph).toMatchObject({ modifiedTime: '2026-06-01T18:00:00Z' });
		});

		it('names no author when the article has none', async () => {
			mockSanity();

			const metadata = await generateMetadata(routeProps());

			expect(metadata.openGraph).toMatchObject({ authors: undefined });
		});

		it('points the canonical URL at the first category of the article', async () => {
			mockSanity({
				article: {
					...ARTICLE,
					categories: [{ slug: 'fussball' }, { slug: 'vereinsleben' }],
					slug: 'sommerfest',
				},
			});

			const metadata = await generateMetadata(routeProps());

			expect(metadata.alternates?.canonical).toBe('/news/fussball/sommerfest');
		});

		it('falls back to the requested category for the canonical URL', async () => {
			mockSanity({ article: { ...ARTICLE, categories: null, slug: 'sommerfest' } });

			const metadata = await generateMetadata(routeProps());

			expect(metadata.alternates?.canonical).toBe('/news/vereinsleben/sommerfest');
		});

		it('looks the article up by its slug without stega encoding', async () => {
			mockSanity();

			await generateMetadata(routeProps());

			expect(mockedSanityFetch).toHaveBeenCalledWith({
				params: { slug: 'sommerfest' },
				query: newsArticleContentQuery,
				stega: false,
			});
		});
	});

	describe('rendering', () => {
		it.each([
			['article', { article: null }],
			['hero document', { hero: null }],
		])('gives up without the %s', async (_name, results) => {
			mockSanity(results);

			await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('looks up nothing in the slug histories when only the hero document is missing', async () => {
			mockSanity({ hero: null });

			await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_NOT_FOUND');
			expect(queriesSent()).not.toContain(newsArticleRedirectQuery);
		});

		// WEB-421: a renamed article broke every link shared on Facebook, Instagram and WhatsApp.
		describe('under a former slug', () => {
			it('redirects to the article that used to have the slug, under its first category', async () => {
				mockSanity({ article: null, redirect: { category: 'fussball', slug: 'sommerfest-2026' } });

				await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_REDIRECT');
				expect(vi.mocked(permanentRedirect)).toHaveBeenCalledExactlyOnceWith(
					'/news/fussball/sommerfest-2026',
				);
			});

			it('looks the slug up in the histories without stega encoding', async () => {
				mockSanity({ article: null, redirect: { category: 'fussball', slug: 'sommerfest-2026' } });

				await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_REDIRECT');
				expect(mockedSanityFetch).toHaveBeenCalledWith({
					params: { slug: 'sommerfest' },
					query: newsArticleRedirectQuery,
					stega: false,
				});
			});

			it('is not found when no article ever had the slug', async () => {
				mockSanity({ article: null });

				await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_NOT_FOUND');
				expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
			});

			it('is not found when the article that had the slug has no category', async () => {
				mockSanity({ article: null, redirect: { category: null, slug: 'sommerfest-2026' } });

				await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_NOT_FOUND');
				expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
			});
		});

		// A renamed category leaves the slug of the article alone, so the article is still found and
		// the category check sends the old path on, without a history lookup.
		it('sends the old path of a renamed category on to the article under its current one', async () => {
			mockSanity({ article: { ...ARTICLE, categories: [{ slug: 'vereinsleben-neu' }] } });

			await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_REDIRECT');
			expect(vi.mocked(permanentRedirect)).toHaveBeenCalledWith(
				'/news/vereinsleben-neu/sommerfest',
			);
			expect(queriesSent()).not.toContain(newsArticleRedirectQuery);
		});

		// WEB-415: the article rendered under any category segment, and the cache would have kept a copy
		// for every one somebody typed.
		it('sends a request under another category on to the first category of the article', async () => {
			mockSanity({
				article: { ...ARTICLE, categories: [{ slug: 'fussball' }, { slug: 'vereinsleben' }] },
			});

			await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_REDIRECT');
			expect(vi.mocked(permanentRedirect)).toHaveBeenCalledWith('/news/fussball/sommerfest');
		});

		it('renders under the first category without redirecting', async () => {
			mockSanity();

			await NewsArticlePage(routeProps());

			expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
		});

		it('compares the path without the stega encoding of draft mode', async () => {
			const article = { _id: 'article-sommerfest', _type: 'news.article' };
			mockSanity({
				article: {
					...ARTICLE,
					categories: [{ slug: encodeLikeDraftMode('vereinsleben', article) }],
					slug: encodeLikeDraftMode('sommerfest', article),
				},
			});

			await NewsArticlePage(routeProps());

			expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
		});

		it('redirects to a path without the stega encoding of draft mode', async () => {
			const article = { _id: 'article-sommerfest', _type: 'news.article' };
			mockSanity({
				article: { ...ARTICLE, categories: [{ slug: encodeLikeDraftMode('fussball', article) }] },
			});

			await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_REDIRECT');
			expect(vi.mocked(permanentRedirect)).toHaveBeenCalledWith('/news/fussball/sommerfest');
		});

		it('has no page for an article without a category', async () => {
			mockSanity({ article: { ...ARTICLE, categories: null } });

			await expect(NewsArticlePage(routeProps())).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(permanentRedirect)).not.toHaveBeenCalled();
		});

		it('heads the page with the featured image and the shared hero titles', async () => {
			mockSanity();

			const hero = findElement(await NewsArticlePage(routeProps()), Hero);

			expect(hero?.props).toMatchObject({
				image: { alt: 'Das Sommerfest' },
				subTitle: 'Aktuelles',
				title: 'News',
			});
		});

		it('ends the breadcrumb in the headline, below the category of the URL', async () => {
			mockSanity({
				article: {
					...ARTICLE,
					categories: [
						{ slug: 'vereinsleben', title: 'Vereinsleben' },
						{ slug: 'fussball', title: 'Fußball' },
					],
				},
			});

			const hero = findElement(await NewsArticlePage(routeProps()), Hero);

			expect(hero?.props.breadcrumb).toStrictEqual({
				page: 'Sommerfest 2026',
				parents: { '/news/vereinsleben': 'Vereinsleben' },
			});
		});

		it('finds the category of the URL by its slug in draft mode as well', async () => {
			mockSanity({
				article: {
					...ARTICLE,
					categories: [
						{
							slug: encodeLikeDraftMode('vereinsleben', CATEGORY_DOCUMENT),
							title: 'Vereinsleben',
						},
					],
				},
			});

			const hero = findElement(await NewsArticlePage(routeProps()), Hero);

			expect(hero?.props.breadcrumb?.parents).toStrictEqual({
				'/news/vereinsleben': 'Vereinsleben',
			});
		});

		it('describes the article as structured data under its canonical URL', async () => {
			mockSanity({
				article: {
					...ARTICLE,
					_updatedAt: '2026-06-03T08:00:00Z',
					publishedAt: '2026-06-01T18:00:00Z',
				},
			});

			const jsonLd = findElement(await NewsArticlePage(routeProps()), JsonLd);

			expect(jsonLd?.props.data).toMatchObject({
				'@type': 'NewsArticle',
				dateModified: '2026-06-03T08:00:00Z',
				datePublished: '2026-06-01T18:00:00Z',
				headline: 'Sommerfest 2026',
				mainEntityOfPage: 'http://localhost:3000/news/vereinsleben/sommerfest',
			});
		});

		it('leaves the hero without an image when the featured image has no alt text', async () => {
			mockSanity({ article: { ...ARTICLE, featuredImage: { asset: { _ref: ASSET_REF } } } });

			const hero = findElement(await NewsArticlePage(routeProps()), Hero);

			expect(hero?.props.image).toBeUndefined();
		});

		it('renders a block content block as rich text', async () => {
			const page = await renderWithBody([
				{ _key: 'text', _type: 'blockContent', text: [{ _key: 'block', _type: 'block' }] },
			]);

			expect(findElement(page, PortableText)?.props.value).toStrictEqual([
				{ _key: 'block', _type: 'block' },
			]);
		});

		it('renders a gallery block as a gallery', async () => {
			const page = await renderWithBody([
				{
					_key: 'gallery',
					_type: 'gallery',
					images: [imageBlock('one')],
					title: 'Impressionen',
				},
			]);

			const gallery = findElement(page, Gallery);

			expect(gallery?.props.title).toBe('Impressionen');
			expect(gallery?.props.images).toMatchObject([{ alt: 'Bild one' }]);
		});

		it('renders a grid block as a lightbox gallery of its images', async () => {
			const page = await renderWithBody([
				{
					_key: 'grid',
					_type: 'grid',
					columns: { large: '3', medium: '2', small: '1' },
					items: [imageBlock('one'), { _key: 'other', _type: 'spacer' }],
				},
			]);

			const grid = findElement(page, LightboxGallery);

			// Only the images of the grid reach the lightbox; other item types are filtered out.
			expect(grid?.props.images).toMatchObject([{ alt: 'Bild one' }]);
		});

		it('renders a main image block as a zoomable image', async () => {
			const page = await renderWithBody([
				imageBlock('single', { description: 'Bildunterschrift' }),
			]);

			expect(findElement(page, ZoomableImage)?.props.image).toMatchObject({
				alt: 'Bild single',
				caption: 'Bildunterschrift',
			});
		});

		it('skips a main image block whose asset cannot be resolved', async () => {
			const page = await renderWithBody([{ _key: 'broken', _type: 'mainImage', alt: 'Kaputt' }]);

			expect(findElement(page, ZoomableImage)).toBeUndefined();
		});

		it('renders a spacer block as a separator', async () => {
			const page = await renderWithBody([{ _key: 'spacer', _type: 'spacer' }]);

			expect(findElement(page, Separator)).toBeDefined();
		});

		it('renders nothing for an unknown block type', async () => {
			const page = await renderWithBody([{ _key: 'unknown', _type: 'somethingNew' }]);

			expect(findElements(page, PortableText)).toStrictEqual([]);
			expect(findElement(page, Separator)).toBeUndefined();
		});

		it('offers the downloads of the article below its text', async () => {
			const downloads = [{ _key: 'jhv', document: { asset: null }, title: 'Einladung JHV' }];
			mockSanity({
				article: { ...ARTICLE, body: [{ _key: 'spacer', _type: 'spacer' }], downloads },
			});

			const article = articleElement(await NewsArticlePage(routeProps()));

			expect(sectionTypes(article).at(-1)).toBe(Downloads);
			expect(findElement(article.props.children, Downloads)?.props.downloads).toStrictEqual(
				downloads,
			);
		});

		it('shows the sponsors only when there are sponsors', async () => {
			mockSanity({ sponsors: [{ _id: 'sponsor-1', name: 'Sponsor' }] });

			const page = await NewsArticlePage(routeProps());

			expect(findElement(page, Sponsors)?.props.sponsors).toMatchObject([{ _id: 'sponsor-1' }]);
		});

		it('leaves the sponsors out without sponsors', async () => {
			mockSanity({ sponsors: null });

			const page = await NewsArticlePage(routeProps());

			expect(findElement(page, Sponsors)).toBeUndefined();
		});
	});
});
