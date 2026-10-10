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

export { getArticlePath };
