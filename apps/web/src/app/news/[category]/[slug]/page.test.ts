import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import NewsArticlePage, { generateMetadata } from '@/app/news/[category]/[slug]/page';
import { Hero } from '@/components/section/hero';
import { Gallery } from '@/components/ui/gallery';
import { LightboxGallery } from '@/components/ui/lightbox';
import { PortableText } from '@/components/ui/portable-text';
import { Separator } from '@/components/ui/separator';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import {
	newsArticleContentQuery,
	newsArticleHeroQuery,
} from '@/lib/sanity/queries/pages/news-article';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import { sponsorsQuery } from '@/lib/sanity/queries/shared/sponsors';

import { findElement, findElements } from '../../../../../test-utils/react-tree';
import { sanityFetchMock } from '../../../../../test-utils/sanity-live-mock';
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
const ARTICLE = {
	excerpt: 'Ein Rückblick auf das Sommerfest.',
	featuredImage: { alt: 'Das Sommerfest', asset: { _ref: ASSET_REF, _type: 'reference' } },
	title: 'Sommerfest 2026',
};

interface ArticleResults {
	article?: unknown;
	hero?: unknown;
	socialMedia?: unknown;
	sponsors?: null | unknown[];
}

function mockSanity({
	article = ARTICLE,
	hero = HERO,
	socialMedia = { instagram: 'https://instagram.example' },
	sponsors = [],
}: ArticleResults = {}): void {
	// oxlint-disable-next-line typescript/require-await -- stands in for an async fetcher
	mockedSanityFetch.mockImplementation(async ({ query }) => {
		if (query === newsArticleHeroQuery) return { data: hero };
		if (query === newsArticleContentQuery) return { data: article };
		if (query === socialMediaQuery) return { data: socialMedia };
		if (query === sponsorsQuery) return { data: sponsors };
		throw new Error(`unexpected query: ${query}`);
	});
}

function routeProps(): PageProps<'/news/[category]/[slug]'> {
	// `PageProps<'/news/[category]/[slug]'>` types the params as a promise.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return {
		params: Promise.resolve({ category: 'vereinsleben', slug: 'sommerfest' }),
	} as unknown as PageProps<'/news/[category]/[slug]'>;
}

async function renderWithBody(body: unknown[]): Promise<ReactNode> {
	mockSanity({ article: { ...ARTICLE, body } });
	return NewsArticlePage(routeProps());
}

describe('news article page', () => {
	afterEach(() => {
		mockedSanityFetch.mockReset();
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
					meta: { metaDescription: 'Kurzfassung', metaTitle: 'Sommerfest · TSG Irlich' },
				},
			});

			await expect(generateMetadata(routeProps())).resolves.toMatchObject({
				description: 'Kurzfassung',
				title: 'Sommerfest · TSG Irlich',
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

		it('heads the page with the featured image and the shared hero titles', async () => {
			mockSanity();

			const hero = findElement(await NewsArticlePage(routeProps()), Hero);

			expect(hero?.props).toMatchObject({
				image: { alt: 'Das Sommerfest' },
				subTitle: 'Aktuelles',
				title: 'News',
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
