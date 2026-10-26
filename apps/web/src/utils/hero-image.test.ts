import { describe, expect, it } from 'vite-plus/test';

import type { AnyImage } from '@/types/image.types';
import { OFFER_FALLBACK_IMAGE } from '@/utils/fallback-image';
import type * as heroImageModule from '@/utils/hero-image';

import { loadWithEnv } from '../../test-utils/env';

type HeroImageModule = typeof heroImageModule;

const SANITY_ENV = {
	NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
	NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
};

/** The `image-<id>-<width>x<height>-<format>` shape `@sanity/image-url` requires. */
const HERO_ASSET = 'image-heroaaa111-800x600-jpg';
const CARD_ASSET = 'image-cardbbb222-800x600-jpg';

function sanityImage(alt: string, asset?: string): AnyImage {
	return {
		_type: 'extendedImage',
		alt,
		...(asset && { asset: { _ref: asset, _type: 'reference' } }),
	};
}

async function loadHeroImage(): Promise<HeroImageModule> {
	return loadWithEnv<HeroImageModule>('@/utils/hero-image', SANITY_ENV);
}

describe('hero image', () => {
	it('shows the first image that has a file', async () => {
		const { getHeroImage } = await loadHeroImage();

		const image = getHeroImage(
			[sanityImage('Hero', HERO_ASSET), sanityImage('Kachel', CARD_ASSET)],
			'Fußball',
		);

		expect(image.alt).toBe('Hero');
		expect(image.src).toContain('heroaaa111');
	});

	it('crops the image to the full width of the hero', async () => {
		const { getHeroImage } = await loadHeroImage();

		const { searchParams } = new URL(
			getHeroImage([sanityImage('Hero', HERO_ASSET)], 'Fußball').src as string,
		);

		expect(searchParams.get('w')).toBe('1920');
		expect(searchParams.get('h')).toBe('600');
	});

	it.each([
		['is missing', null],
		['has no file', sanityImage('Leer')],
	])('falls back to the next image when the first %s', async (_name, first) => {
		const { getHeroImage } = await loadHeroImage();

		const image = getHeroImage([first, sanityImage('Kachel', CARD_ASSET)], 'Fußball');

		expect(image.alt).toBe('Kachel');
		expect(image.src).toContain('cardbbb222');
	});

	it('shows the offer image when no image has a file', async () => {
		const { getHeroImage } = await loadHeroImage();

		expect(getHeroImage([sanityImage('Leer'), undefined], 'Fußball')).toStrictEqual(
			OFFER_FALLBACK_IMAGE,
		);
	});

	// The hero renders no image without an alt text, so an empty one must not hide the picture.
	it('names the image after the title when its alt text is empty', async () => {
		const { getHeroImage } = await loadHeroImage();

		expect(getHeroImage([sanityImage('', HERO_ASSET)], 'Fußball').alt).toBe('Fußball');
	});
});
