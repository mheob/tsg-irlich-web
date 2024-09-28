import imageUrlBuilder from '@sanity/image-url';
import type { Image } from '@sanity/types';
import { sanityClient } from 'sanity:client';

const builder = imageUrlBuilder(sanityClient);

/**
 * Generates a URL for a Sanity image with specified dimensions.
 *
 * @param source - The Sanity image object to generate a URL for.
 * @param height - The height of the image to generate a URL for.
 * @param width - The width of the image to generate a URL for.
 * @returns An ImageUrlBuilder instance with the specified dimensions.
 *
 * @example
 * const imageUrl = urlFor(sanityImageObject, 300).url();
 */
export function urlFor(source: Image, height?: number, width?: number) {
	return height
		? builder
				.image(source)
				.width(width ?? height)
				.height(height)
		: builder.image(source);
}
