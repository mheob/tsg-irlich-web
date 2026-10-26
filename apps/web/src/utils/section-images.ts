import { urlForImage } from '@/lib/sanity/utils';
import type { AnyImage, ResolvedImage } from '@/types/image.types';

/**
 * The edge of the square the round images of the vision section and the contact form are requested
 * in: twice the largest circle (320 px), for sharp screens.
 */
const SECTION_IMAGE_SIZE = 640;

/**
 * Resolves the images of a section that places each one at a fixed position. An image without a
 * file stays an empty position, so the others keep their place.
 *
 * @param images - The images of the section, in the order of their positions.
 * @param fallbackAlt - The alt text of an image that has none, usually the section title.
 * @returns One entry per position, `undefined` where there is nothing to show.
 */
function resolveSectionImages(
	images: readonly (AnyImage | null | undefined)[] | null | undefined,
	fallbackAlt: string,
): (ResolvedImage | undefined)[] {
	return (images ?? []).map((image) => {
		const src = urlForImage(image, SECTION_IMAGE_SIZE);
		// An empty alt text counts as missing too
		// oxlint-disable-next-line typescript/prefer-nullish-coalescing
		return image && src ? { alt: image.alt || fallbackAlt, src } : undefined;
	});
}

export { resolveSectionImages, SECTION_IMAGE_SIZE };
