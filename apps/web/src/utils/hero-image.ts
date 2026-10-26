import type { ComponentProps } from 'react';

import type { Hero } from '@/components/section/hero';
import { urlForImage, urlForImageMax } from '@/lib/sanity/utils';
import type { AnyImage, SanityImageReference } from '@/types/image.types';

const HERO_IMAGE_SIZE = { height: 600, width: 1920 };

/**
 * The width the hero of a single page is requested in. The banner spans the whole screen, and the
 * Next.js image optimizer serves every smaller size from this source.
 */
const PAGE_HERO_MAX_WIDTH = 3840;

const PERCENT = 100;

type HeroImage = NonNullable<ComponentProps<typeof Hero>['image']>;

/**
 * Picks the picture the hero of a department or group page shows: the first of the images that has
 * a file. An image without an asset counts as missing, so a hero image the editors emptied does not
 * hide a card image that is still there. The caller puts the fallback image of the site settings
 * last.
 *
 * @param images - The candidates, the one to prefer first (the hero image before the card image).
 * @param title - The title of the department or group, the alt text of an image that has none.
 * @returns The image of the hero with its alt text, or `undefined` when no candidate has a file.
 */
function getHeroImage(
	images: readonly (AnyImage | null | undefined)[],
	title: string,
): HeroImage | undefined {
	for (const image of images) {
		const src = urlForImage(image, HERO_IMAGE_SIZE.height, HERO_IMAGE_SIZE.width);

		if (image && src) {
			// An empty alt text counts as missing too: the hero shows no image without one
			// oxlint-disable-next-line typescript/prefer-nullish-coalescing
			return { alt: image.alt || title, src };
		}
	}

	return undefined;
}

/**
 * Where a point of the image lies inside the crop, as a percentage of the visible part, clamped to
 * its edges and rounded to one decimal.
 *
 * @param point - The position in the whole image, 0 to 1.
 * @param start - The share the crop cuts off at the start (left or top).
 * @param end - The share the crop cuts off at the end (right or bottom).
 * @returns The percentage.
 */
function toPercent(point: number, start = 0, end = 0): number {
	const share = Math.min(Math.max((point - start) / (1 - start - end), 0), 1);
	return Number((share * PERCENT).toFixed(1));
}

/**
 * Where the browser places an image that `object-cover` crops: at the hotspot the editors set,
 * measured inside the crop rectangle, since the URL already delivers only that part.
 *
 * @param image - The image with its crop and hotspot.
 * @returns The CSS `object-position`, or `undefined` without a hotspot, which leaves it centred.
 */
function getObjectPosition(
	image: Pick<SanityImageReference, 'crop' | 'hotspot'>,
): string | undefined {
	const { crop, hotspot } = image;
	if (!hotspot) {
		return undefined;
	}

	return `${toPercent(hotspot.x, crop?.left, crop?.right)}% ${toPercent(hotspot.y, crop?.top, crop?.bottom)}%`;
}

/**
 * The picture the hero of a single page shows. It is requested uncropped, so the banner can show as
 * much of it as the screen allows, and positioned at its hotspot.
 *
 * @param image - The hero image of the page.
 * @param title - The title of the page, the alt text of an image that has none.
 * @returns The image of the hero, or `undefined` when it has no file.
 */
function getPageHeroImage(
	image: AnyImage | null | undefined,
	title: string,
): HeroImage | undefined {
	const src = urlForImageMax(image, PAGE_HERO_MAX_WIDTH);
	if (!image || !src) {
		return undefined;
	}

	// An empty alt text counts as missing too: the hero shows no image without one
	// oxlint-disable-next-line typescript/prefer-nullish-coalescing
	return { alt: image.alt || title, objectPosition: getObjectPosition(image), src };
}

export { getHeroImage, getObjectPosition, getPageHeroImage };
