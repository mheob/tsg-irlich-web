import { urlForImage, urlForImageMax } from '@/lib/sanity/utils';
import type { SanityImageReference } from '@/types/sanity.types';

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
function getInitials(firstName: string, lastName: string): string {
	const sanitizedFirst = (firstName || '').trim();
	const sanitizedLast = (lastName || '').trim();

	if (!sanitizedFirst && !sanitizedLast) {
		return '??';
	}

	return `${sanitizedFirst.charAt(0) || '?'}${sanitizedLast.charAt(0) || '?'}`.toUpperCase();
}

/**
 * Width the full screen version of a gallery image is scaled down to.
 *
 * The image keeps its original aspect ratio, so this is an upper bound and not a crop.
 */
const FULL_IMAGE_WIDTH = 2560;

/**
 * Builds the image data a gallery and its lightbox need.
 *
 * @param images - The array of images from a Sanity document (may be undefined or empty)
 * @param height - Optional height for the thumbnail URL
 * @param width - Optional width for the thumbnail URL. Falls back to the height
 * @returns An array of GalleryImage objects, or an empty array if images are missing/empty
 *
 * @example
 * ```ts
 * const images = getGalleryImages(gallery, 700, 1244);
 * // images[0].src is the thumbnail, images[0].srcFull the uncropped full screen version
 * ```
 */
function getGalleryImages(
	images: GalleryImageSource[] | null | undefined,
	height?: number,
	width?: number,
): GalleryImage[] {
	if (!images || images.length === 0) {
		return [];
	}

	const galleryImages: GalleryImage[] = [];

	for (const image of images) {
		const src = urlForImage(image, height, width);
		const srcFull = urlForImageMax(image, FULL_IMAGE_WIDTH);

		if (src && srcFull) {
			galleryImages.push({
				alt: image.alt,
				caption: image.description,
				key: image._key,
				src,
				srcFull,
			});
		}
	}

	return galleryImages;
}

/** An image of a Sanity document that can be shown in a gallery. */
type GalleryImageSource = SanityImageReference & {
	_key: string;
	description?: string;
};

/** An image prepared for the gallery grid and the lightbox. */
interface GalleryImage {
	/** Alternative text of the image. */
	alt: string;
	/** Optional caption, shown below the image in the lightbox. */
	caption?: string;
	/** Stable key of the image. */
	key: string;
	/** URL of the thumbnail shown in the grid. */
	src: string;
	/** URL of the full screen version shown in the lightbox. */
	srcFull: string;
}

export { getInitials, getGalleryImages };
export type { GalleryImage, GalleryImageSource };
