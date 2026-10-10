import type { FlipbookPage } from '@/components/with-logic/flipbook/types';
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
 * The download of an issue's PDF, with its size for the button label.
 *
 * @param pdf - The projected PDF asset.
 * @returns The link and the size, or `undefined` when the asset cannot be downloaded.
 */
function getPdfDownload(pdf?: EchoPdf | null): PdfDownload | undefined {
	if (!pdf?.url || !pdf.originalFilename) {
		return undefined;
	}
	const href = getDownloadFileUrl({ originalFilename: pdf.originalFilename, url: pdf.url });
	return { href, size: getFileSize(pdf.size ?? undefined) };
}

/**
 * One page image in the three widths the CDN delivers.
 *
 * @param page - The page image.
 * @param alt - Its alternative text.
 * @returns The flipbook page, or `undefined` for an image without an asset.
 */
function toFlipbookPage(page: EchoPageImage, alt: string): FlipbookPage | undefined {
	// The projection may carry a `null` asset, which the image URL builder does not take.
	const image = page.asset ? ({ _type: 'image', asset: page.asset } as const) : undefined;
	const src = urlForImageMax(image, LARGEST_PAGE_WIDTH);
	if (!src) {
		return undefined;
	}
	const srcSet = PAGE_WIDTHS.map((width) => `${urlForImageMax(image, width)} ${width}w`).join(', ');
	return { alt, src, srcSet };
}

/**
 * Every page of an issue, named after its position.
 *
 * @param pages - The rendered page images, cover first.
 * @returns The flipbook pages.
 */
function getFlipbookPages(pages: readonly EchoPageImage[]): FlipbookPage[] {
	return pages.flatMap((image, index) => {
		const page = toFlipbookPage(image, `Seite ${index + 1} von ${pages.length}`);
		return page ? [page] : [];
	});
}

/**
 * The cover of an issue, for the server-rendered stand-in of the flipbook.
 *
 * @param cover - The first page image.
 * @param title - The issue's title.
 * @returns The cover, or `undefined` without an image.
 */
function getCoverPage(
	cover?: EchoPageImage | null,
	title?: string | null,
): FlipbookPage | undefined {
	return cover ? toFlipbookPage(cover, `Titelseite von ${title ?? 'TSG-Echo'}`) : undefined;
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

export { getCoverPage, getFlipbookPages, getIssueYear, getPageSize, getPdfDownload };
export type { EchoPageImage, EchoPdf, PdfDownload };
