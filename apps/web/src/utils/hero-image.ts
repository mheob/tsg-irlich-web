import type { ComponentProps } from 'react';

import type { Hero } from '@/components/section/hero';
import { urlForImage } from '@/lib/sanity/utils';
import type { AnyImage } from '@/types/image.types';
import { OFFER_FALLBACK_IMAGE } from '@/utils/fallback-image';

const HERO_IMAGE_SIZE = { height: 600, width: 1920 };

type HeroImage = NonNullable<ComponentProps<typeof Hero>['image']>;

/**
 * Picks the picture the hero of a department or group page shows: the first of the images that has
 * a file, else the offer image that stands in everywhere. An image without an asset counts as
 * missing, so a hero image the editors emptied does not hide a card image that is still there.
 *
 * @param images - The candidates, the one to prefer first (the hero image before the card image).
 * @param title - The title of the department or group, the alt text of an image that has none.
 * @returns The image of the hero with its alt text.
 */
function getHeroImage(images: readonly (AnyImage | null | undefined)[], title: string): HeroImage {
	for (const image of images) {
		const src = urlForImage(image, HERO_IMAGE_SIZE.height, HERO_IMAGE_SIZE.width);

		if (image && src) {
			// An empty alt text counts as missing too: the hero shows no image without one
			// oxlint-disable-next-line typescript/prefer-nullish-coalescing
			return { alt: image.alt || title, src };
		}
	}

	return OFFER_FALLBACK_IMAGE;
}

export { getHeroImage };
