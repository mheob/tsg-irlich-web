import { describe, expect, it } from 'vite-plus/test';

import type { AnyImage } from '@/types/image.types';
import type * as sectionImagesModule from '@/utils/section-images';

import { loadWithEnv } from '../../test-utils/env';

type SectionImagesModule = typeof sectionImagesModule;

const SANITY_ENV = {
	NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
	NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
};

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const FIRST_ASSET = 'image-firstaaa111-600x600-webp';
const THIRD_ASSET = 'image-thirdccc333-600x600-webp';

function sanityImage(alt: string, asset?: string): AnyImage {
	return {
		_type: 'extendedImage',
		alt,
		...(asset && { asset: { _ref: asset, _type: 'reference' } }),
	};
}

async function loadSectionImages(): Promise<SectionImagesModule> {
	return loadWithEnv<SectionImagesModule>('@/utils/section-images', SANITY_ENV);
}

describe('section images', () => {
	it('keeps every image at its position and leaves out one without a file', async () => {
		const { resolveSectionImages } = await loadSectionImages();

		const images = resolveSectionImages(
			[
				sanityImage('Erstes', FIRST_ASSET),
				sanityImage('Leer'),
				sanityImage('Drittes', THIRD_ASSET),
			],
			'Vision',
		);

		expect(images.map((image) => image?.alt)).toStrictEqual(['Erstes', undefined, 'Drittes']);
		expect(images[2]?.src).toContain('thirdccc333');
	});

	it('crops every image to a square around its hotspot', async () => {
		const { resolveSectionImages, SECTION_IMAGE_SIZE } = await loadSectionImages();

		const [image] = resolveSectionImages([sanityImage('Erstes', FIRST_ASSET)], 'Vision');
		const { searchParams } = new URL(String(image?.src));

		expect(SECTION_IMAGE_SIZE).toBe(640);
		expect(searchParams.get('w')).toBe('640');
		expect(searchParams.get('h')).toBe('640');
	});

	it('names an image without alt text after the section', async () => {
		const { resolveSectionImages } = await loadSectionImages();

		expect(resolveSectionImages([sanityImage('', FIRST_ASSET)], 'Vision')[0]?.alt).toBe('Vision');
	});

	it('gives no images when the list is missing', async () => {
		const { resolveSectionImages } = await loadSectionImages();

		expect(resolveSectionImages(null, 'Vision')).toStrictEqual([]);
	});
});
