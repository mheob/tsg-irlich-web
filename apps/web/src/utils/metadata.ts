import type { Metadata } from 'next';

import { urlForImage } from '@/lib/sanity/utils';
import type { AnyImage } from '@/types/image.types';

type OpenGraph = NonNullable<Metadata['openGraph']>;
type OpenGraphImages = OpenGraph['images'];

/** The club's name, which the title template appends and every open graph object names as the site. */
const SITE_NAME = 'TSG Irlich';

/**
 * The open graph fields every page shares.
 *
 * Next.js merges metadata shallowly: a page that sets `openGraph` replaces the layout's object
 * whole instead of adding to it. That is why {@link getPageMetadata} repeats these on every page.
 */
const SITE_OPEN_GRAPH = {
	locale: 'de_DE',
	siteName: SITE_NAME,
	type: 'website',
} as const satisfies OpenGraph;

/** The RSS feed, announced on every page. Replaced as a whole like `openGraph`, see above. */
const FEED_ALTERNATES = { 'application/rss+xml': '/feed.xml' };

/**
 * A title that already names the club skips the layout's `%s | TSG Irlich` template. Most meta
 * titles in the studio do (145 of 162 at the time of writing), and the club would appear twice.
 */
const CLUB_NAME_MARKER = 'Irlich';

const OPEN_GRAPH_IMAGE_SIZE = { height: 630, width: 1200 };

/**
 * Builds the open graph image of a page, cropped to the size social previews use.
 *
 * @param image - The Sanity image to show.
 * @param title - The alt text to use when the image has none.
 * @returns The open graph image, or `undefined` when there is no image to show.
 */
function getOpenGraphImageOptions(image?: AnyImage | null, title?: string | null): OpenGraphImages {
	if (!image) {
		return undefined;
	}

	const imageUrl = urlForImage(image, OPEN_GRAPH_IMAGE_SIZE.height, OPEN_GRAPH_IMAGE_SIZE.width);

	if (!imageUrl) {
		return undefined;
	}

	return {
		alt: image.alt ?? title ?? '',
		height: OPEN_GRAPH_IMAGE_SIZE.height,
		url: imageUrl,
		width: OPEN_GRAPH_IMAGE_SIZE.width,
	};
}

/**
 * Resolves the document title of a page against the layout's title template.
 *
 * @param title - The page title.
 * @returns The title, as `absolute` when it already names the club, or nothing when it is empty,
 * which leaves the layout's default title in place.
 */
function getTitle(title: string): Metadata['title'] {
	if (!title) {
		return undefined;
	}

	return title.includes(CLUB_NAME_MARKER) ? { absolute: title } : title;
}

interface PageMeta {
	metaDescription?: string | null;
	metaTitle?: string | null;
	openGraphImage?: AnyImage | null;
}

interface PageMetadataOptions {
	/** The description to use when `meta` sets none. */
	description?: string | null;
	/** The image to use when `meta` sets no open graph image. */
	image?: AnyImage | null;
	/** The `meta` object the editors maintain for the document. */
	meta?: PageMeta | null;
	/** Open graph fields that extend or replace the defaults, such as an article's dates. */
	openGraph?: OpenGraph;
	/** The canonical path of the page, resolved against `metadataBase`. */
	path: string;
	/** The document title, used when `meta` sets none and as the image's alt text. */
	title?: string | null;
}

/**
 * Builds the metadata of a content page.
 *
 * The editors' `meta` object wins over the document's own title, description and image. Every page
 * gets its canonical URL, the RSS feed and the complete site-wide open graph fields.
 *
 * @param options - The page's document parts and canonical path.
 * @param options.description - The description to use when `meta` sets none.
 * @param options.image - The image to use when `meta` sets no open graph image.
 * @param options.meta - The `meta` object the editors maintain for the document.
 * @param options.openGraph - Open graph fields that extend or replace the defaults.
 * @param options.path - The canonical path of the page.
 * @param options.title - The document title.
 * @returns The page's metadata.
 */
function getPageMetadata({
	description,
	image,
	meta,
	openGraph,
	path,
	title,
}: PageMetadataOptions): Metadata {
	const pageTitle = meta?.metaTitle ?? title ?? '';
	const pageDescription = meta?.metaDescription ?? description ?? '';
	const openGraphImage = meta?.openGraphImage ?? image;

	return {
		alternates: { canonical: path, types: FEED_ALTERNATES },
		description: pageDescription,
		openGraph: {
			...SITE_OPEN_GRAPH,
			description: pageDescription,
			images: getOpenGraphImageOptions(openGraphImage, title) ?? [],
			title: pageTitle,
			url: path,
			...openGraph,
		},
		title: getTitle(pageTitle),
	};
}

export { FEED_ALTERNATES, SITE_NAME, SITE_OPEN_GRAPH, getOpenGraphImageOptions, getPageMetadata };
