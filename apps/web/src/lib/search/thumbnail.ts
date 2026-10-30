import { linkAsset } from '@/lib/echo/archive-url';
import { urlForImage } from '@/lib/sanity/utils';

import type { SearchHitKind, SearchThumbnail } from './types';

/** The height of a thumbnail as the CDN crops it, twice what the panel shows for sharp displays. */
const THUMBNAIL_HEIGHT = 270;

/** The width of a thumbnail as the CDN crops it: 16 : 9 to the height. */
const THUMBNAIL_WIDTH = 480;

/**
 * The image in front of a hit: the one the overviews show for its type, cropped to 16 : 9.
 *
 * The cover of a TSG-Echo issue that search engines must not find goes through the archive path,
 * as it does in the archive on `/verein/echo`, and bypasses the image optimizer, which would serve
 * it without the `noindex` header.
 *
 * @param image - The image of the hit, as the search queries project it.
 * @param kind - What the hit is.
 * @param indexable - Whether search engines may find a TSG-Echo issue. Only `false` hides the cover;
 * an issue from before the field existed has `null` and is indexable, as everywhere else.
 * @returns The thumbnail, or `null` when the hit has no image with a file, which shows the logo.
 */
function getSearchThumbnail(
	image: Parameters<typeof urlForImage>[0],
	kind: SearchHitKind,
	indexable?: boolean | null,
): SearchThumbnail | null {
	const url = urlForImage(image, THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH);
	if (!url) {
		return null;
	}

	const isHidden = kind === 'echo' && indexable === false;

	return { src: linkAsset(url, !isHidden), unoptimized: isHidden };
}

export { getSearchThumbnail };
