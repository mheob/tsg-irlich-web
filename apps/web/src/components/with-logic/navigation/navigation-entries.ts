import { getInternalHref, type InternalLinkTarget } from '@/utils/links';

/** Label of the link a group adds for its own page, ahead of its children. */
const OVERVIEW_TITLE = 'Übersicht';

const EXTERNAL_LINK_TYPE = 'external';
const ROOT_PATH = '/';

/**
 * Whether `pathname` is the page `href` points at or a page below it. The home page only matches
 * itself, otherwise it would match everything.
 *
 * @param pathname - The current path.
 * @param href - The path of the link.
 * @returns `true` on a match.
 */
function matchesPath(pathname: string, href: string): boolean {
	return pathname === href || (href !== ROOT_PATH && pathname.startsWith(`${href}/`));
}

/**
 * Whether a link points at the current page. External links never do.
 *
 * @param link - The resolved link.
 * @param pathname - The current path.
 * @returns `true` on a match.
 */
function isCurrent(link: NavigationLink, pathname: string): boolean {
	return !link.isExternal && matchesPath(pathname, link.href);
}

/**
 * Resolves a link from the query result. An entry without `linkType` (written before the migration)
 * is internal, and an external entry follows `href` even if a stale page reference is left over.
 *
 * @param data - One entry or sub-entry of the query result.
 * @returns The link, still inactive, or `undefined` if it has no title or no resolvable target.
 */
function toLink(data: NavigationLinkData): NavigationLink | undefined {
	const isExternal = data.linkType === EXTERNAL_LINK_TYPE;
	const href = isExternal ? data.href : getInternalHref(data.link);

	if (!href || !data.title) {
		return undefined;
	}

	return { href, isActive: false, isExternal, key: data._key, title: data.title };
}

/**
 * Marks the link with the longest matching href active and every other one inactive, so that on
 * `/verein/chronik` only "Chronik" is active and not "Übersicht" as well. A tie goes to the first.
 *
 * @param links - The links of one group.
 * @param pathname - The current path.
 * @returns The same links with `isActive` set.
 */
function markLongestMatch(links: NavigationLink[], pathname: string): NavigationLink[] {
	// `toSorted` is stable, so of two equally long matches the first one wins.
	const [active] = links
		.filter((link) => isCurrent(link, pathname))
		.toSorted((first, second) => second.href.length - first.href.length);

	return links.map((link) => ({ ...link, isActive: link === active }));
}

/**
 * Builds the entry for one item of the main navigation.
 *
 * @param item - One item of the query result.
 * @param pathname - The current path.
 * @returns A group if at least one child resolves, a plain link otherwise, or `undefined` if the
 *   item can be neither.
 */
function toEntry(item: NavigationItemData, pathname: string): NavigationEntry | undefined {
	if (!item.title) {
		return undefined;
	}

	const parent = toLink(item);
	const children = item.children
		.map((child) => toLink(child))
		.filter((link): link is NavigationLink => link !== undefined);

	if (children.length === 0) {
		return parent
			? { kind: 'link', link: { ...parent, isActive: isCurrent(parent, pathname) } }
			: undefined;
	}

	const overview = parent
		? [{ ...parent, key: `${parent.key}-overview`, title: OVERVIEW_TITLE }]
		: [];
	const links = markLongestMatch([...overview, ...children], pathname);

	return {
		isActive: links.some((link) => link.isActive),
		key: item._key,
		kind: 'group',
		links,
		title: item.title,
	};
}

/**
 * Turns the main navigation from Sanity into what both menus render: resolved hrefs, the active
 * state, and a group with its "Übersicht" link wherever an item has children.
 *
 * @param items - `mainNavigation` from `mainNavigationQuery`.
 * @param pathname - The current path from `usePathname()`.
 * @returns The entries in their original order, without the ones that cannot be rendered.
 */
function getNavigationEntries(
	items: readonly NavigationItemData[],
	pathname: string,
): NavigationEntry[] {
	return items
		.map((item) => toEntry(item, pathname))
		.filter((entry): entry is NavigationEntry => entry !== undefined);
}

interface NavigationLinkData {
	_key: string;
	href: string | null;
	link: InternalLinkTarget | null;
	linkType: string | null;
	title: string | null;
}

interface NavigationItemData extends NavigationLinkData {
	children: readonly NavigationLinkData[];
}

interface NavigationLink {
	href: string;
	isActive: boolean;
	isExternal: boolean;
	key: string;
	title: string;
}

interface NavigationLinkEntry {
	kind: 'link';
	link: NavigationLink;
}

interface NavigationGroupEntry {
	isActive: boolean;
	key: string;
	kind: 'group';
	links: NavigationLink[];
	title: string;
}

type NavigationEntry = NavigationGroupEntry | NavigationLinkEntry;

export { getNavigationEntries, OVERVIEW_TITLE };
export type {
	NavigationEntry,
	NavigationGroupEntry,
	NavigationItemData,
	NavigationLink,
	NavigationLinkData,
	NavigationLinkEntry,
};
