import { describe, expect, it } from 'vite-plus/test';

import type { AnyImage } from '@/types/image.types';
import type * as metadataModule from '@/utils/metadata';

import { loadWithEnv } from '../../test-utils/env';

type MetadataModule = typeof metadataModule;

const SANITY_ENV = {
	NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
	NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
};

// The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires; an arbitrary
// string throws when the builder resolves the URL.
const ASSET_REF = 'image-abc123def456-800x600-jpg';

function buildImage(overrides: Partial<AnyImage> = {}): AnyImage {
	// The generated image types carry more optional fields than a fixture needs to name.
	return {
		_type: 'image',
		asset: { _ref: ASSET_REF, _type: 'reference' },
		...overrides,
	} as AnyImage;
}

/**
 * Reads the URL out of the open graph image options.
 *
 * Kept out of the test bodies because the options type is a union of several shapes and the
 * narrowing would be a conditional, which `vitest/no-conditional-in-test` flags.
 *
 * @param options - The options returned by `getOpenGraphImageOptions`.
 * @returns The image URL.
 */
function imageUrlOf(options: unknown): string {
	if (typeof options !== 'object' || options === null || !('url' in options)) {
		throw new TypeError('Expected open graph image options with a URL');
	}
	return String(options.url);
}

async function loadMetadata(): Promise<MetadataModule> {
	return loadWithEnv<MetadataModule>('@/utils/metadata', SANITY_ENV);
}

describe('open graph image options', () => {
	it('has no options without an image', async () => {
		const { getOpenGraphImageOptions } = await loadMetadata();

		expect(getOpenGraphImageOptions(undefined, 'Sommerfest')).toBeUndefined();
	});

	it('has no options for an image without an asset', async () => {
		const { getOpenGraphImageOptions } = await loadMetadata();

		expect(getOpenGraphImageOptions(buildImage({ asset: undefined }))).toBeUndefined();
	});

	it('requests the image in the open graph format', async () => {
		const { getOpenGraphImageOptions } = await loadMetadata();

		const options = getOpenGraphImageOptions(buildImage(), 'Sommerfest');

		expect(options).toMatchObject({ height: 630, width: 1200 });
	});

	it('crops the image to those dimensions', async () => {
		const { getOpenGraphImageOptions } = await loadMetadata();

		const options = getOpenGraphImageOptions(buildImage(), 'Sommerfest');
		const url = imageUrlOf(options);

		expect(url).toContain('w=1200');
		expect(url).toContain('h=630');
		expect(url).toContain('fit=crop');
	});

	it('prefers the alt text of the image', async () => {
		const { getOpenGraphImageOptions } = await loadMetadata();

		const options = getOpenGraphImageOptions(
			buildImage({ alt: 'Das Sommerfest 2026' }),
			'Sommerfest',
		);

		expect(options).toMatchObject({ alt: 'Das Sommerfest 2026' });
	});

	it('falls back to the title when the image has no alt text', async () => {
		const { getOpenGraphImageOptions } = await loadMetadata();

		expect(getOpenGraphImageOptions(buildImage(), 'Sommerfest')).toMatchObject({
			alt: 'Sommerfest',
		});
	});

	it('falls back to an empty alt text when neither is given', async () => {
		const { getOpenGraphImageOptions } = await loadMetadata();

		expect(getOpenGraphImageOptions(buildImage())).toMatchObject({ alt: '' });
	});
});

describe('page metadata', () => {
	it('prefers the meta fields over the document title, description and image', async () => {
		const { getPageMetadata } = await loadMetadata();

		const metadata = getPageMetadata({
			description: 'Aus dem Dokument',
			image: buildImage({ alt: 'Dokumentbild' }),
			meta: {
				metaDescription: 'Aus dem Meta-Objekt',
				metaTitle: 'Sommerfest',
				openGraphImage: buildImage({ alt: 'Meta-Bild' }),
			},
			path: '/news',
			title: 'Dokumenttitel',
		});

		expect(metadata).toMatchObject({
			description: 'Aus dem Meta-Objekt',
			openGraph: {
				description: 'Aus dem Meta-Objekt',
				images: { alt: 'Meta-Bild' },
				title: 'Sommerfest',
			},
			title: 'Sommerfest',
		});
	});

	it('falls back to the document title, description and image', async () => {
		const { getPageMetadata } = await loadMetadata();

		const metadata = getPageMetadata({
			description: 'Aus dem Dokument',
			image: buildImage(),
			meta: null,
			path: '/news',
			title: 'Dokumenttitel',
		});

		expect(metadata).toMatchObject({
			description: 'Aus dem Dokument',
			openGraph: { images: { alt: 'Dokumenttitel' }, title: 'Dokumenttitel' },
			title: 'Dokumenttitel',
		});
	});

	it('has an empty description and no image when nothing provides them', async () => {
		const { getPageMetadata } = await loadMetadata();

		const metadata = getPageMetadata({ path: '/news', title: 'Dokumenttitel' });

		expect(metadata).toMatchObject({ description: '', openGraph: { description: '', images: [] } });
	});

	it('lets a title that names the club skip the title template', async () => {
		const { getPageMetadata } = await loadMetadata();

		const metadata = getPageMetadata({
			path: '/',
			title: 'Mehr als Sport – wir sind die TSG Irlich.',
		});

		expect(metadata.title).toStrictEqual({ absolute: 'Mehr als Sport – wir sind die TSG Irlich.' });
	});

	it('leaves the layout title in place when the page has none', async () => {
		const { getPageMetadata } = await loadMetadata();

		const metadata = getPageMetadata({ path: '/news', title: null });

		expect(metadata.title).toBeUndefined();
	});

	it('points the canonical and the open graph URL at the page and keeps the feed', async () => {
		const { getPageMetadata } = await loadMetadata();

		const metadata = getPageMetadata({ path: '/angebot/fussball', title: 'Fußball' });

		expect(metadata.alternates).toStrictEqual({
			canonical: '/angebot/fussball',
			types: { 'application/rss+xml': '/feed.xml' },
		});
		expect(metadata.openGraph).toMatchObject({ url: '/angebot/fussball' });
	});

	it('repeats the site-wide open graph fields on every page', async () => {
		const { getPageMetadata } = await loadMetadata();

		const metadata = getPageMetadata({ path: '/verein', title: 'Verein' });

		expect(metadata.openGraph).toMatchObject({
			locale: 'de_DE',
			siteName: 'TSG Irlich',
			type: 'website',
		});
	});

	it('lets the page extend and replace the open graph defaults', async () => {
		const { getPageMetadata } = await loadMetadata();

		const metadata = getPageMetadata({
			openGraph: { publishedTime: '2026-05-01T10:00:00Z', type: 'article' },
			path: '/news/fussball/sieg',
			title: 'Sieg',
		});

		expect(metadata.openGraph).toMatchObject({
			publishedTime: '2026-05-01T10:00:00Z',
			siteName: 'TSG Irlich',
			type: 'article',
		});
	});
});
