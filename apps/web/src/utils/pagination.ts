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

export { getPageCount, getPageNumber, getPaginatedPath, getPaginationRange };
export type { PaginationSlot };
