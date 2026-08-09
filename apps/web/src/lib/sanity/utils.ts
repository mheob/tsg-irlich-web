import { createImageUrlBuilder } from '@sanity/image-url';

import type { SanityFileAsset, SanityImage, SanityImageReference } from '@/types/sanity.types';

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
function getDownloadFileUrl(downloadAsset?: null | SanityFileAsset): string {
	if (!downloadAsset?.url || !downloadAsset.originalFilename) {
		return '#!';
	}
	return `${downloadAsset.url}?dl=${downloadAsset.originalFilename}`;
}

/**
 * Converts a file size in bytes to a human-readable string.
 *
 * @param sanitySize - The file size in bytes.
 * @returns The human-readable file size (e.g., "1.2 MB", "512 KB", "—" if size is undefined/null/0).
 *
 * @example
 * getFileSize(1234567) // "1.18 MB"
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
	return `${size.toFixed(index)} ${units[index]}`;
}

const imageBuilder = createImageUrlBuilder(client);

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
const urlForImage = (
	image: null | SanityImage | SanityImageReference | undefined,
	height?: number,
	width?: number,
): string | undefined => {
	if (!image?.asset?._ref) {
		return undefined;
	}
	return height
		? imageBuilder
				.image(image)
				.width(width ?? height)
				.height(height)
				.fit('crop')
				.format('webp')
				.url()
		: imageBuilder.image(image).auto('format').fit('max').format('webp').url();
};

export { getDownloadFileUrl, getFileSize, urlForImage };
