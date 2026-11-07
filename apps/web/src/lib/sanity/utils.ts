import { createImageUrlBuilder } from '@sanity/image-url';
import type { ImageFormat } from '@sanity/image-url';

import type { SanityImage, SanityImageReference } from '@/types/sanity.types';

import { client } from './client';

const BYTES_PER_KB = 1024;

/**
 * Generates a download URL for a Sanity file asset, appending a .pdf extension and setting the download filename.
 *
 * @param downloadAsset - The Sanity file asset object containing the file URL and original filename.
 * @returns The constructed download URL as a string.
 *
 * @example
 * ```ts
 * const url = getDownloadFileUrl(asset);
 * // url: "https://cdn.sanity.io/files/yourProjectId/yourDataset/yourFileId.pdf?dl=custom-filename.pdf"
 * ```
 */
function getDownloadFileUrl(
	// A projection such as `asset-> { originalFilename, url }` types a missing field as `null`.
	downloadAsset?: null | { originalFilename?: null | string; url?: null | string },
): string {
	if (!downloadAsset?.url || !downloadAsset.originalFilename) {
		return '#!';
	}
	return `${downloadAsset.url}?dl=${encodeURIComponent(downloadAsset.originalFilename)}`;
}

/**
 * Converts a file size in bytes to a human-readable string.
 *
 * @param sanitySize - The file size in bytes.
 * @returns The human-readable file size with a German decimal comma (e.g., "1,2 MB", "512 B", "—"
 * if size is undefined/null/0).
 *
 * @example
 * getFileSize(1234567) // "1,18 MB"
 * getFileSize(0) // "—"
 * getFileSize(undefined) // "—"
 */
function getFileSize(sanitySize?: number): string {
	if (!sanitySize || sanitySize < 1) {
		return '—';
	}
	const units = ['B', 'KB', 'MB', 'GB'];
	let index = 0;
	let size = sanitySize;
	while (size >= BYTES_PER_KB && index < units.length - 1) {
		size /= BYTES_PER_KB;
		index += 1;
	}
	return `${size.toFixed(index).replace('.', ',')} ${units[index]}`;
}

const imageBuilder = createImageUrlBuilder(client);

/**
 * Quality of the images requested from Sanity.
 *
 * Sanity only delivers the source image for the Next.js image optimizer, which re-encodes it to
 * AVIF or WebP afterwards. A quality above Sanity's default of 75 keeps that second encoding from
 * compounding compression artifacts.
 */
const SOURCE_QUALITY = 90;

/**
 * The format Sanity delivers the images of the website in.
 *
 * WebP, whatever the editors uploaded: the Next.js image optimizer still re-encodes every image to
 * AVIF or WebP, but it first has to fetch the source, and the browser loads the pages of a TSG-Echo
 * issue straight from the Sanity CDN. A PNG of 2.8 MB, the source of the home hero, arrives as about
 * 386 KB, which shortens every uncached first request.
 */
const SOURCE_FORMAT = 'webp' satisfies ImageFormat;

/**
 * The format of the images other services fetch: open graph previews and structured data. Not every
 * social platform reads WebP, while every one reads JPEG, and the size of these images never
 * reaches a visitor.
 */
const SHARED_FORMAT = 'jpg' satisfies ImageFormat;

/**
 * Builds the URL of a Sanity image in the given format: cropped when a height is given, otherwise
 * scaled to fit its own aspect ratio.
 *
 * @param image - The Sanity image object to generate a URL for
 * @param format - The format Sanity converts the image to
 * @param size - The height to crop to, and the width, which defaults to the height
 * @param size.height - The height to crop to; without it the image is not cropped
 * @param size.width - The width to crop to
 * @returns A URL string for the processed image, or undefined if image is invalid
 */
function buildImageUrl(
	image: null | SanityImage | SanityImageReference | undefined,
	format: ImageFormat,
	{ height, width }: { height?: number; width?: number },
): string | undefined {
	if (!image?.asset?._ref) {
		return undefined;
	}
	return height
		? imageBuilder
				.image(image)
				.width(width ?? height)
				.height(height)
				.fit('crop')
				.format(format)
				.quality(SOURCE_QUALITY)
				.url()
		: imageBuilder.image(image).fit('max').format(format).quality(SOURCE_QUALITY).url();
}

/**
 * Generates a URL for a Sanity image with optional dimensions, as WebP.
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
 * // Get URL scaled to fit the original aspect ratio
 * const autoUrl = urlForImage(sanityImage);
 * ```
 */
const urlForImage = (
	image: null | SanityImage | SanityImageReference | undefined,
	height?: number,
	width?: number,
): string | undefined => buildImageUrl(image, SOURCE_FORMAT, { height, width });

/**
 * Generates a URL for a Sanity image that another service fetches, an open graph preview or the
 * image of structured data. It is cropped like {@link urlForImage}, but delivered as JPEG.
 *
 * @param image - The Sanity image object to generate a URL for
 * @param height - The height to crop the image to
 * @param width - The width to crop the image to
 * @returns A URL string for the processed image, or undefined if image is invalid
 *
 * @example
 * ```ts
 * const openGraphUrl = urlForSharedImage(sanityImage, 630, 1200);
 * ```
 */
const urlForSharedImage = (
	image: null | SanityImage | SanityImageReference | undefined,
	height: number,
	width: number,
): string | undefined => buildImageUrl(image, SHARED_FORMAT, { height, width });

/**
 * Generates a URL for a Sanity image that is scaled down to fit a maximum width.
 *
 * Unlike {@link urlForImage} this never crops: the original aspect ratio is preserved, which makes
 * it the right choice for full screen views like the lightbox.
 *
 * @param image - The Sanity image object to generate a URL for
 * @param maxWidth - The width the image is scaled down to, if it is larger
 * @returns A URL string for the processed image, or undefined if image is invalid
 *
 * @example
 * ```ts
 * const fullSizeUrl = urlForImageMax(sanityImage, 2560);
 * ```
 */
const urlForImageMax = (
	image: null | SanityImage | SanityImageReference | undefined,
	maxWidth: number,
): string | undefined => {
	if (!image?.asset?._ref) {
		return undefined;
	}
	return imageBuilder
		.image(image)
		.width(maxWidth)
		.fit('max')
		.format(SOURCE_FORMAT)
		.quality(SOURCE_QUALITY)
		.url();
};

export { getDownloadFileUrl, getFileSize, urlForImage, urlForImageMax, urlForSharedImage };
