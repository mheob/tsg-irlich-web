import createImageUrlBuilder from '@sanity/image-url';
import type { Image } from 'sanity';

import { dataset, projectId } from '@/lib/sanity/api';

const imageBuilder = createImageUrlBuilder({
	dataset: dataset || '',
	projectId: projectId || '',
});

/**
 * Generates a URL for a Sanity image with optional dimensions.
 *
 * @param image - The Sanity image object to generate a URL for
 * @param height - Optional height to resize the image to
 * @param width - Optional width to resize the image to. If not provided but height is, will use height value
 * @returns A URL string for the processed image, or undefined if image is invalid
 *
 * @example
 * ```ts
 * // Get URL with specific dimensions
 * const imageUrl = urlForImage(sanityImage, 300, 400);
 *
 * // Get URL with square dimensions
 * const squareUrl = urlForImage(sanityImage, 300);
 *
 * // Get URL with auto formatting
 * const autoUrl = urlForImage(sanityImage);
 * ```
 */
// eslint-disable-next-line ts/no-explicit-any
export const urlForImage = (image: any, height?: number, width?: number): string | undefined => {
	if (!image?.asset?._ref || !imageBuilder) return;
	return height
		? imageBuilder
				.image(image)
				.width(width ?? height)
				.height(height)
				.fit('crop')
				.url()
		: imageBuilder.image(image).auto('format').fit('max').url();
};

/**
 * Resolves an OpenGraph image from a Sanity image asset.
 *
 * @param image - The Sanity image object to generate OpenGraph metadata for
 * @param width - The width of the OpenGraph image in pixels (default: 1200)
 * @param height - The height of the OpenGraph image in pixels (default: 627)
 * @returns An object containing the image URL, dimensions and alt text, or undefined if invalid
 *
 * @example
 * ```ts
 * // Get default OpenGraph image metadata
 * const ogImage = resolveOpenGraphImage(sanityImage);
 *
 * // Get custom sized OpenGraph image metadata
 * const customOgImage = resolveOpenGraphImage(sanityImage, 800, 600);
 * ```
 */
export function resolveOpenGraphImage(
	image: Image,
	width = 1200,
	height = 627,
): undefined | { alt: string; height: number; url: string; width: number } {
	if (!image || !imageBuilder) return;
	const url = imageBuilder.image(image)?.width(width).height(height).fit('crop').url();
	if (!url) return;
	return { alt: image.alt as string, height, url, width };
}

// export function linkResolver(link: Link | undefined) {
// 	if (!link) return null;

// 	// If linkType is not set but href is, lets set linkType to "href".  This comes into play when pasting links into the portable text editor because a link type is not assumed.
// 	if (!link.linkType && link.href) {
// 		link.linkType = 'href';
// 	}

// 	switch (link.linkType) {
// 		case 'href': {
// 			return link.href || null;
// 		}
// 		case 'page': {
// 			if (link?.page) {
// 				return `/${link.page}`;
// 			}
// 			return null;
// 		}
// 		case 'post': {
// 			if (link?.post) {
// 				return `/posts/${link.post}`;
// 			}
// 			return null;
// 		}
// 		default: {
// 			return null;
// 		}
// 	}
// }
