import { groupSections } from './groups';

/** The document type of the home page, which is served from the site root. */
const HOME_TYPE = 'home';

/** The document type of a news article, which is served below its first category. */
const NEWS_ARTICLE_TYPE = 'news.article';

/** The document type of a news category, which is served below the news overview. */
const NEWS_CATEGORY_TYPE = 'news.category';

/** The type prefix shared by every group document. */
const GROUP_TYPE_PREFIX = 'group.';

/** Map from a group document type to the path of the department it belongs to. */
const departmentPathByGroupType = new Map(
	groupSections.map((section) => [section._type, section.slug]),
);

/**
 * Builds the path of a group, which lives below the department its type belongs to.
 *
 * @param type - The document type of the group.
 * @param slug - The slug of the group.
 * @returns The path of the group, or `undefined` if its department has no page.
 */
function getGroupHref(type: string, slug: string): string | undefined {
	const departmentPath = departmentPathByGroupType.get(type);
	// A group whose department has no page on the website (e.g. the administration) has no URL.
	return departmentPath ? `${departmentPath}/${slug}` : undefined;
}

/**
 * Builds the path of a document from its type, slug and — for a news article — its category.
 *
 * @param type - The document type.
 * @param slug - The slug of the document, which only holds the last segment of the URL.
 * @param category - The slug of the category a news article belongs to.
 * @returns The path of the document, or `undefined` if it cannot be resolved.
 */
function getHrefForType(type: string, slug: string, category?: string): string | undefined {
	if (type === HOME_TYPE) {
		return '/';
	}

	if (type === NEWS_ARTICLE_TYPE) {
		return category ? `/news/${category}/${slug}` : undefined;
	}

	if (type === NEWS_CATEGORY_TYPE) {
		return `/news/${slug}`;
	}

	if (type.startsWith(GROUP_TYPE_PREFIX)) {
		return getGroupHref(type, slug);
	}

	// Every remaining linkable document is a single page whose slug already is the full path.
	return `/${slug}`;
}

/**
 * Builds the path of an internal link target.
 *
 * A slug in Sanity only holds the last segment of the URL, so the full path has to be derived from
 * the document type: news articles live below their category, groups below their department and the
 * home page at the root.
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

	return getHrefForType(type, slug, target.category ?? undefined);
}

interface InternalLinkTarget {
	_type?: string | null;
	category?: string | null;
	slug?: string | null;
}

export { getInternalHref, type InternalLinkTarget };
