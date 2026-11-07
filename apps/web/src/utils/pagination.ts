/**
 * Reads the page number of a paginated overview from its `seite` search parameter.
 *
 * @param page - The raw `seite` search parameter.
 * @returns The page number, or 1 when the parameter is missing or not a positive number.
 */
function getPageNumber(page?: string | string[]): number {
	const pageString = Array.isArray(page) ? page[0] : page;
	const parsed = Math.trunc(Number(pageString ?? '1'));
	return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

/**
 * The folder of the internal route that serves the later pages of a cached overview. `next.config.ts`
 * rewrites `/news?seite=2` to `/news/seite/2`, which is cached like any static page, unlike a page
 * that reads its search parameters. The public address keeps the parameter.
 */
const PAGE_SEGMENT = 'seite';

/** A whole number without leading zeros, the only spelling the rewrite passes on. */
const LATER_PAGE_PATTERN = /^[1-9]\d*$/u;

/** The internal page segment at the end of a path, `/seite/<n>`. */
const PAGE_SEGMENT_SUFFIX = new RegExp(`/${PAGE_SEGMENT}/[1-9]\\d*$`, 'u');

/**
 * Reads the page number from the internal page segment of a cached overview.
 *
 * Only the later pages come through it: the first page is the overview itself, and a number in
 * another spelling (`02`, `2.5`) is no address the rewrite produces.
 *
 * @param segment - The `[page]` segment of the internal route.
 * @returns The page number, or `undefined` when the segment names no later page.
 */
function getLaterPageNumber(segment: string): number | undefined {
	if (!LATER_PAGE_PATTERN.test(segment)) {
		return undefined;
	}

	const pageNumber = Number(segment);
	return Number.isSafeInteger(pageNumber) && pageNumber >= 2 ? pageNumber : undefined;
}

/**
 * Turns the path of the internal route that serves a later page back into the overview's path.
 *
 * A prerendered page knows the path it was rendered for (`/news/seite/2`), while the browser shows the
 * address it asked for (`/news?seite=2`). What the page derives from its path has to come out the same
 * for both, or the hydration fails.
 *
 * @param pathname - A path, possibly ending in the internal page segment.
 * @returns The path without that segment.
 */
function getOverviewPath(pathname: string): string {
	return pathname.replace(PAGE_SEGMENT_SUFFIX, '');
}

/**
 * Builds the canonical path of a page of a paginated overview.
 *
 * Every page points at itself, since each one lists different articles. The first page drops the
 * parameter, so it shares its canonical URL with the plain overview link. A path that has a query
 * string already (`/suche?q=Tanzen`) keeps it and gets the page appended.
 *
 * @param path - The path of the overview, with its query string if it has one.
 * @param pageNumber - The page number.
 * @returns The canonical path.
 */
function getPaginatedPath(path: string, pageNumber: number): string {
	if (pageNumber <= 1) {
		return path;
	}

	return `${path}${path.includes('?') ? '&' : '?'}seite=${pageNumber}`;
}

/**
 * Counts the pages of a paginated overview.
 *
 * @param options - The size of the list and how it is split.
 * @param options.perPage - The items per page.
 * @param options.startIndex - The index of the first paginated item; the items before it are shown
 * elsewhere on the page (the latest news, the newest TSG-Echo issue).
 * @param options.total - The number of items, including those before the start index.
 * @returns The number of pages, 0 when no item is left to paginate.
 */
function getPageCount({ perPage, startIndex, total }: PageCountOptions): number {
	return Math.max(0, Math.ceil((total - startIndex) / perPage));
}

/** The slots of the page links: first page, ellipsis, current page with neighbours, ellipsis, last page. */
const MAX_SLOTS = 7;

/**
 * Lists the page links of a paginated overview.
 *
 * Up to seven pages are listed in full. Beyond that the list always holds exactly seven slots, so
 * the navigation keeps its width while paging through. The first and the last page stay, the
 * current page keeps its neighbours, and an ellipsis takes the place of at least two pages.
 *
 * @param currentPage - The page shown, from 1.
 * @param pageCount - The number of pages.
 * @returns The page numbers and the ellipses, in order.
 */
function getPaginationRange(currentPage: number, pageCount: number): PaginationSlot[] {
	if (pageCount <= MAX_SLOTS) {
		return Array.from({ length: pageCount }, (_, index) => index + 1);
	}

	// The first page, an ellipsis and the current page with its neighbours fit into the first five
	// slots up to page 4, likewise at the end.
	const edgeLength = MAX_SLOTS - 2;
	if (currentPage <= edgeLength - 1) {
		return [
			...Array.from({ length: edgeLength }, (_, index) => index + 1),
			'ellipsis-end',
			pageCount,
		];
	}
	if (currentPage >= pageCount - edgeLength + 2) {
		return [
			1,
			'ellipsis-start',
			...Array.from({ length: edgeLength }, (_, index) => pageCount - edgeLength + 1 + index),
		];
	}

	return [
		1,
		'ellipsis-start',
		currentPage - 1,
		currentPage,
		currentPage + 1,
		'ellipsis-end',
		pageCount,
	];
}

interface PageCountOptions {
	perPage: number;
	startIndex: number;
	total: number;
}

type PaginationSlot = 'ellipsis-end' | 'ellipsis-start' | number;

export {
	getLaterPageNumber,
	getOverviewPath,
	getPageCount,
	getPageNumber,
	getPaginatedPath,
	getPaginationRange,
};
export type { PaginationSlot };
