import { urlForImage } from '@/lib/sanity/utils';
import type { GroupDance } from '@/types/sanity.types';

/**
 * Generates initials from a person's first and last name.
 *
 * @param firstName - The person's first name
 * @param lastName - The person's last name
 * @returns A string containing the first letter of each name in uppercase, or '?' for missing names
 *
 * @example
 * ```ts
 * getInitials('John', 'Doe') // Returns 'JD'
 * getInitials('Jane', '') // Returns 'J?'
 * getInitials('', '') // Returns '??'
 * ```
 */
export function getInitials(firstName: string, lastName: string): string {
	const sanitizedFirst = (firstName || '').trim();
	const sanitizedLast = (lastName || '').trim();

	if (!sanitizedFirst && !sanitizedLast) return '??';

	return `${sanitizedFirst.charAt(0) || '?'}${sanitizedLast.charAt(0) || '?'}`.toUpperCase();
}

/**
 * Represents an item with image and corresponding URLs used for display and full-resolution.
 */
interface ImageItem {
	/** The image object from the Sanity GroupDance images array. */
	image: NonNullable<GroupDance['images']>[number];
	/** The URL for the display-optimized version of the image. */
	src: string;
	/** The URL for the full-resolution version of the image. */
	srcFull: string;
}

/**
 * Generates an array of image items containing image references and their URLs for display and full screen.
 *
 * @param images - The array of images from a GroupDance item (may be undefined or empty)
 * @param height - Optional desired height for the display image URL
 * @param width - Optional desired width for the display image URL
 * @returns An array of ImageItem objects, or an empty array if images are missing/empty
 *
 * @example
 * ```ts
 * const items = getImageItems(gallery, 700, 1244);
 * // items[0].src is a display-size image, items[0].srcFull is a full-res image
 * ```
 */
export function getImageItems(
	images: GroupDance['images'],
	height?: number,
	width?: number,
): Array<ImageItem> {
	if (!images || images.length === 0) return [];

	const items = [];
	for (const image of images) {
		const source = urlForImage(image, height, width);
		const sourceFull = urlForImage(image, 1440, 2560);
		if (!source || !sourceFull) continue;
		items.push({ image, src: source, srcFull: sourceFull });
	}

	return items;
}
