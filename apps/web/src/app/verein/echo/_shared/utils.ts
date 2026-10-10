import type { FlipbookPage } from '@/components/with-logic/flipbook/types';
import { toArchiveUrl } from '@/lib/echo/archive-url';
import { getDownloadFileUrl, getFileSize, urlForImageMax } from '@/lib/sanity/utils';
import type { EchoIssueQueryResult } from '@/types/sanity.types';

const YEAR_LENGTH = 4;

const SMALL_PAGE_WIDTH = 800;
const MEDIUM_PAGE_WIDTH = 1200;
const LARGEST_PAGE_WIDTH = 1600;

/** The widths the Sanity CDN renders a page in; the browser picks one through `srcSet`. */
const PAGE_WIDTHS = [SMALL_PAGE_WIDTH, MEDIUM_PAGE_WIDTH, LARGEST_PAGE_WIDTH] as const;

/** A4 at the render route's 2000 px on the long edge, for an image without metadata. */
const A4_PAGE = { height: 2000, width: 1414 };

/**
 * The year an issue appeared in, for its label.
 *
 * @param releaseDate - The release date as `YYYY-MM-DD`.
 * @returns The year, or an empty string without a date.
 */
function getIssueYear(releaseDate?: string | null): string {
	return releaseDate?.slice(0, YEAR_LENGTH) ?? '';
}

/**
 * The URL a visitor gets for an asset: the CDN's own, or the archive path's, which tells search
 * engines to stay away.
 *
 * `indexable` is the issue's own field, not a behaviour switch: two functions instead would split
 * every helper that links an asset, hence the NOSONAR for S2301.
 *
 * @param url - The CDN URL.
 * @param indexable - Whether search engines may find the issue.
 * @returns The URL to link.
 */
function linkAsset(url: string, indexable: boolean /* NOSONAR */): string {
	return indexable ? url : toArchiveUrl(url);
}

/**
 * The download of an issue's PDF, with its size for the button label.
 *
 * @param pdf - The projected PDF asset.
 * @param indexable - Whether search engines may find the issue; default true.
 * @returns The link and the size, or `undefined` when the asset cannot be downloaded.
 */
function getPdfDownload(pdf?: EchoPdf | null, indexable = true): PdfDownload | undefined {
	if (!pdf?.url || !pdf.originalFilename) {
		return undefined;
	}
	const href = getDownloadFileUrl({ originalFilename: pdf.originalFilename, url: pdf.url });
	return { href: linkAsset(href, indexable), size: getFileSize(pdf.size ?? undefined) };
}

/**
 * A projected page image in the shape the URL builder takes. The projection may carry a `null`
 * asset, which the builder does not accept.
 *
 * @param page - The projected page image.
 * @returns The image, or `undefined` without an asset.
 */
function toSanityImage(page?: PageAsset | null): SanityPageImage | undefined {
	return page?.asset ? { _type: 'image', asset: page.asset } : undefined;
}

/**
 * The URL of a cover in the width a card shows it in.
 *
 * @param cover - The first page image.
 * @param width - The width in pixels.
 * @param indexable - Whether search engines may find the issue; default true.
 * @returns The URL, or `undefined` without an asset.
 */
function getCoverUrl(
	cover: PageAsset | null | undefined,
	width: number,
	indexable = true,
): string | undefined {
	const url = urlForImageMax(toSanityImage(cover), width);
	return url && linkAsset(url, indexable);
}

/**
 * One page image in the three widths the CDN delivers.
 *
 * @param page - The page image.
 * @param leaf - What the page needs besides its image.
 * @param leaf.alt - Its alternative text.
 * @param leaf.id - Its key in the book.
 * @param leaf.indexable - Whether search engines may find the issue.
 * @returns The flipbook page, or `undefined` for an image without an asset.
 */
function toFlipbookPage(page: PageAsset, { alt, id, indexable }: Leaf): FlipbookPage | undefined {
	const image = toSanityImage(page);
	const src = urlForImageMax(image, LARGEST_PAGE_WIDTH);
	if (!src) {
		return undefined;
	}
	const srcSet = PAGE_WIDTHS.map(
		(width) => `${linkAsset(urlForImageMax(image, width) ?? '', indexable)} ${width}w`,
	).join(', ');
	return { alt, id, src: linkAsset(src, indexable), srcSet };
}

/**
 * Every page of an issue, named after its position.
 *
 * @param pages - The rendered page images, cover first.
 * @param indexable - Whether search engines may find the issue; default true.
 * @returns The flipbook pages.
 */
function getFlipbookPages(pages: readonly EchoPageImage[], indexable = true): FlipbookPage[] {
	return pages.flatMap((image, index) => {
		const alt = `Seite ${index + 1} von ${pages.length}`;
		const page = toFlipbookPage(image, { alt, id: image._key, indexable });
		return page ? [page] : [];
	});
}

/**
 * The cover of an issue, for the server-rendered stand-in of the flipbook.
 *
 * @param cover - The first page image.
 * @param title - The issue's title.
 * @param indexable - Whether search engines may find the issue; default true.
 * @returns The cover, or `undefined` without an image.
 */
function getCoverPage(
	cover?: PageAsset | null,
	title?: string | null,
	indexable = true,
): FlipbookPage | undefined {
	const alt = `Titelseite von ${title ?? 'TSG-Echo'}`;
	return cover ? toFlipbookPage(cover, { alt, id: 'cover', indexable }) : undefined;
}

/**
 * The page size the flipbook lays out with, from the first page's metadata.
 *
 * @param pageSize - The dimensions of the first page image.
 * @returns Width and height in pixels.
 */
function getPageSize(pageSize?: { height?: number | null; width?: number | null } | null): {
	height: number;
	width: number;
} {
	return pageSize?.height && pageSize.width
		? { height: pageSize.height, width: pageSize.width }
		: A4_PAGE;
}

type EchoIssue = NonNullable<EchoIssueQueryResult>;
type EchoPageImage = NonNullable<EchoIssue['pages']>[number];

/** What the URL builder needs of a page image, which a cover projection also carries. */
type PageAsset = Pick<EchoPageImage, '_type' | 'asset'>;

/** What a flipbook page needs besides its image. */
interface Leaf {
	alt: string;
	id: string;
	indexable: boolean;
}

/** A page image whose asset is known to exist. */
interface SanityPageImage {
	_type: 'image';
	asset: NonNullable<EchoPageImage['asset']>;
}
/**
 * The projected PDF asset. Its fields are optional, because a download must not break on an asset
 * whose upload never finished, whatever the generated type promises.
 */
interface EchoPdf {
	originalFilename?: null | string;
	size?: null | number;
	url?: null | string;
}

interface PdfDownload {
	href: string;
	size: string;
}

export {
	getCoverPage,
	getCoverUrl,
	getFlipbookPages,
	getIssueYear,
	getPageSize,
	getPdfDownload,
	toSanityImage,
};
export type { EchoPageImage, EchoPdf, PdfDownload };
