/**
 * Reads the page number of a paginated news overview from its `seite` search parameter.
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
 * Builds the canonical path of a page of a paginated news overview.
 *
 * Every page points at itself, since each one lists different articles. The first page drops the
 * parameter, so it shares its canonical URL with the plain overview link.
 *
 * @param path - The path of the overview.
 * @param pageNumber - The page number.
 * @returns The canonical path.
 */
function getPaginatedPath(path: string, pageNumber: number): string {
	return pageNumber > 1 ? `${path}?seite=${pageNumber}` : path;
}

interface ArticleLocation {
	categories?: ({ slug?: string | null } | null)[] | null;
	slug?: string | null;
}

/**
 * Builds the path of an article under its first category.
 *
 * An article renders under any category segment, because its query filters by slug only. Its
 * canonical path names the first category, the same one the sitemap and the feed link to, and
 * falls back to the category the request came in under.
 *
 * @param article - The article's categories and slug.
 * @param requestedCategory - The category segment of the request.
 * @param requestedSlug - The slug segment of the request.
 * @returns The article's path.
 */
function getArticlePath(
	article: ArticleLocation,
	requestedCategory: string,
	requestedSlug: string,
): string {
	const category = article.categories?.[0]?.slug ?? requestedCategory;
	return `/news/${category}/${article.slug ?? requestedSlug}`;
}

export { getArticlePath, getPageNumber, getPaginatedPath };
