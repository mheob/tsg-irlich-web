import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';

import { getSearchThumbnail } from './thumbnail';

// `@sanity/image-url` reads the project and the dataset from the client's config to build a URL.
vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
	} as unknown as typeof client,
}));

const CARD_IMAGE = {
	_type: 'extendedImage' as const,
	alt: 'Tanzgruppe auf der Bühne',
	asset: { _ref: 'image-card-1600x900-jpg', _type: 'reference' as const },
};

const COVER = {
	_key: 'cover',
	_type: 'image' as const,
	asset: { _ref: 'image-cover-1414x2000-jpg', _type: 'reference' as const },
};

describe('search thumbnails', () => {
	it('crops a department image to 480 by 270', () => {
		expect(getSearchThumbnail(CARD_IMAGE, 'department')).toStrictEqual({
			src: 'https://cdn.sanity.io/images/test-project/test-dataset/card-1600x900.jpg?w=480&h=270&q=90&fit=crop',
			unoptimized: false,
		});
	});

	// Review focus 3: the optimizer would serve a hidden issue's cover without the noindex header.
	it('links the cover of an Echo issue search engines must not find through the archive path', () => {
		const thumbnail = getSearchThumbnail(COVER, 'echo', false);

		expect(thumbnail?.src).toMatch(/^\/echo-archiv\/images\/cover-1414x2000\.jpg\?.*w=480/u);
		expect(thumbnail?.unoptimized).toBe(true);
	});

	it.each([
		['an indexable issue', true],
		['an issue from before the switch', null],
	])('keeps the CDN url for the cover of %s', (_label, indexable) => {
		const thumbnail = getSearchThumbnail(COVER, 'echo', indexable);

		expect(thumbnail?.src).toMatch(/^https:\/\/cdn\.sanity\.io\/images\//u);
		expect(thumbnail?.unoptimized).toBe(false);
	});

	it.each([
		['no image', null],
		['an image without an asset', { ...CARD_IMAGE, asset: undefined }],
	])('has no thumbnail for %s', (_label, image) => {
		expect(getSearchThumbnail(image, 'page')).toBeNull();
	});
});
