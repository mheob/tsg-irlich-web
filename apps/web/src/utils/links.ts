/** The document type of the home page, which is served from the site root. */
const HOME_TYPE = 'home';

/** The document type of a news article, which is served below its first category. */
const NEWS_ARTICLE_TYPE = 'news.article';

/** The document type of a news category, which is served below the news overview. */
const NEWS_CATEGORY_TYPE = 'news.category';

/** The single page of the TSG-Echo archive. Its slug is `echo`, but it lives below the club page. */
const ECHO_OVERVIEW_TYPE = 'echoOverview';

/** The document type of a TSG-Echo issue, which is served below the archive. */
const ECHO_ISSUE_TYPE = 'echo.issue';

/** The path of the TSG-Echo archive. */
const ECHO_OVERVIEW_PATH = '/verein/echo';

/** The document type of a department, which is served below the offer page. */
const DEPARTMENT_TYPE = 'department';

/** The document type of a group, which is served below its department. */
const GROUP_TYPE = 'group';

/** The path of the offer page, below which every department lives. */
const OFFER_PATH = '/angebot';

/**
 * Builds the path of a TSG-Echo issue.
 *
 * @param slug - The slug of the issue.
 * @returns The path below the archive.
 */
function getEchoIssuePath(slug: string): string {
	return `${ECHO_OVERVIEW_PATH}/${slug}`;
}

/**
 * Builds the path of a group, which lives below its department.
 *
 * @param slug - The slug of the group.
 * @param _category - Unused: only a news article has a category.
 * @param department - The slug of the department the group belongs to.
 * @returns The path of the group, or `undefined` if it has no department.
 */
function getGroupPath(slug: string, _category?: string, department?: string): string | undefined {
	// A group without a department, or whose department document is gone, is not on the website.
	return department ? `${OFFER_PATH}/${department}/${slug}` : undefined;
}

/** The document types whose path is not their slug, mapped to how their path is built. */
const PATH_RESOLVERS = new Map<string, PathResolver>([
	[HOME_TYPE, () => '/'],
	[DEPARTMENT_TYPE, (slug) => `${OFFER_PATH}/${slug}`],
	[GROUP_TYPE, getGroupPath],
	[NEWS_ARTICLE_TYPE, (slug, category) => (category ? `/news/${category}/${slug}` : undefined)],
	[NEWS_CATEGORY_TYPE, (slug) => `/news/${slug}`],
	[ECHO_OVERVIEW_TYPE, () => ECHO_OVERVIEW_PATH],
	[ECHO_ISSUE_TYPE, getEchoIssuePath],
]);

/**
 * Builds the path of a document from its type, slug and — where its path depends on one — its
 * category or department.
 *
 * @param type - The document type.
 * @param slug - The slug of the document, which only holds the last segment of the URL.
 * @param category - The slug of the category a news article belongs to.
 * @param department - The slug of the department a group belongs to.
 * @returns The path of the document, or `undefined` if it cannot be resolved.
 */
// oxlint-disable-next-line eslint/max-params -- the type, the slug and what a path may depend on
function getHrefForType(
	type: string,
	slug: string,
	category?: string,
	department?: string,
): string | undefined {
	const resolvePath = PATH_RESOLVERS.get(type);
	if (resolvePath) {
		return resolvePath(slug, category, department);
	}

	// Every remaining linkable document is a single page whose slug already is the full path.
	return `/${slug}`;
}

/**
 * Builds the path of an internal link target.
 *
 * A slug in Sanity only holds the last segment of the URL, so the full path has to be derived from
 * the document type: news articles live below their category, groups below their department,
 * departments below the offer page and the home page at the root.
 *
 * @param target - The link target as projected by the `internalLinkTarget` GROQ fragment.
 * @returns The path of the target, or `undefined` if it cannot be resolved.
 */
function getInternalHref(target: InternalLinkTarget | null | undefined): string | undefined {
	const type = target?._type;
	const slug = target?.slug;

	if (!type || !slug) {
		return undefined;
	}

	return getHrefForType(type, slug, target.category ?? undefined, target.department ?? undefined);
}

/**
 * Builds the path of a document from its slug and, for a news article, its category or, for a
 * group, its department.
 */
type PathResolver = (slug: string, category?: string, department?: string) => string | undefined;

interface InternalLinkTarget {
	_type?: string | null;
	category?: string | null;
	department?: string | null;
	slug?: string | null;
}

export { ECHO_OVERVIEW_PATH, getEchoIssuePath, getInternalHref, type InternalLinkTarget };
