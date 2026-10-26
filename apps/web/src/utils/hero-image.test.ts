import { describe, expect, it } from 'vite-plus/test';

import type { AnyImage } from '@/types/image.types';
import type { SanityImageCrop, SanityImageHotspot } from '@/types/sanity.types';
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

function hotspot(x: number, y: number): NonNullable<SanityImageHotspot> {
	return { _type: 'sanity.imageHotspot', height: 0.5, width: 0.5, x, y };
}

function crop(
	sides: Partial<Record<'bottom' | 'left' | 'right' | 'top', number>>,
): SanityImageCrop {
	return { _type: 'sanity.imageCrop', bottom: 0, left: 0, right: 0, top: 0, ...sides };
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

		expect(image?.alt).toBe('Hero');
		expect(image?.src).toContain('heroaaa111');
	});

	it('crops the image to the full width of the hero', async () => {
		const { getHeroImage } = await loadHeroImage();

		const { searchParams } = new URL(
			getHeroImage([sanityImage('Hero', HERO_ASSET)], 'Fußball')?.src as string,
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

		expect(image?.alt).toBe('Kachel');
		expect(image?.src).toContain('cardbbb222');
	});

	// The caller appends the fallback image of the site settings as the last candidate.
	it('gives no image when no candidate has a file', async () => {
		const { getHeroImage } = await loadHeroImage();

		expect(getHeroImage([sanityImage('Leer'), undefined], 'Fußball')).toBeUndefined();
	});

	// The server already cropped the image around its hotspot.
	it('leaves the position of a cropped image to the crop', async () => {
		const { getHeroImage } = await loadHeroImage();

		const image = getHeroImage(
			[{ ...sanityImage('Hero', HERO_ASSET), hotspot: hotspot(0.25, 0.75) }],
			'Fußball',
		);

		expect(image?.objectPosition).toBeUndefined();
	});

	// The hero renders no image without an alt text, so an empty one must not hide the picture.
	it('names the image after the title when its alt text is empty', async () => {
		const { getHeroImage } = await loadHeroImage();

		expect(getHeroImage([sanityImage('', HERO_ASSET)], 'Fußball')?.alt).toBe('Fußball');
	});
});

describe('page hero image', () => {
	it('keeps the whole picture and leaves the cropping to the banner', async () => {
		const { getPageHeroImage } = await loadHeroImage();

		const { searchParams } = new URL(
			getPageHeroImage(sanityImage('Hero', HERO_ASSET), 'Kontakt')?.src as string,
		);

		expect(searchParams.get('w')).toBe('3840');
		expect(searchParams.get('fit')).toBe('max');
		expect(searchParams.get('h')).toBeNull();
	});

	it('describes the image with its alt text', async () => {
		const { getPageHeroImage } = await loadHeroImage();

		expect(getPageHeroImage(sanityImage('Ein Büro', HERO_ASSET), 'Kontakt')?.alt).toBe('Ein Büro');
	});

	it('names the image after the page when its alt text is empty', async () => {
		const { getPageHeroImage } = await loadHeroImage();

		expect(getPageHeroImage(sanityImage('', HERO_ASSET), 'Kontakt')?.alt).toBe('Kontakt');
	});

	it.each([
		['is missing', undefined],
		['has no file', sanityImage('Leer')],
	])('gives no image when it %s', async (_name, image) => {
		const { getPageHeroImage } = await loadHeroImage();

		expect(getPageHeroImage(image, 'Kontakt')).toBeUndefined();
	});

	it('positions the picture at its hotspot', async () => {
		const { getPageHeroImage } = await loadHeroImage();

		const image = getPageHeroImage(
			{ ...sanityImage('Hero', HERO_ASSET), hotspot: hotspot(0.25, 0.75) },
			'Kontakt',
		);

		expect(image?.objectPosition).toBe('25% 75%');
	});
});

describe('object position of an image', () => {
	it('places the hotspot of an uncropped image', async () => {
		const { getObjectPosition } = await loadHeroImage();

		expect(getObjectPosition({ hotspot: hotspot(0.25, 0.75) })).toBe('25% 75%');
	});

	it('measures the hotspot inside the crop', async () => {
		const { getObjectPosition } = await loadHeroImage();

		expect(
			getObjectPosition({ crop: crop({ left: 0.2, right: 0.2 }), hotspot: hotspot(0.3, 0.5) }),
		).toBe('16.7% 50%');
	});

	it('keeps a hotspot outside the crop at the edge', async () => {
		const { getObjectPosition } = await loadHeroImage();

		expect(
			getObjectPosition({
				crop: crop({ bottom: 0.3, left: 0.2 }),
				hotspot: hotspot(0.1, 0.9),
			}),
		).toBe('0% 100%');
	});

	it('leaves an image without a hotspot centred', async () => {
		const { getObjectPosition } = await loadHeroImage();

		expect(getObjectPosition({ crop: crop({ left: 0.2 }) })).toBeUndefined();
	});
});
