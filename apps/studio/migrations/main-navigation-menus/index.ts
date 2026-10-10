import { at, defineMigration, set } from 'sanity/migrate';

const LINK_TYPE = 'mainNavigationLink';
const MENU_TYPE = 'mainNavigationMenu';
const LEGACY_TYPE = 'mainNavigationItem';
const CHILD_TYPE = 'navigationLink';
const EXTERNAL_LINK_TYPE = 'external';
const OVERVIEW_TITLE = 'Übersicht';

/**
 * Whether a value has the minimum shape of an array member: a string `_key` and `_type`.
 *
 * @param value - One entry of `mainNavigation`.
 * @returns `true` if the migration can read the entry.
 */
function isNavigationItem(value: unknown): value is NavigationItem {
	return (
		typeof value === 'object' &&
		value !== null &&
		'_key' in value &&
		typeof value._key === 'string' &&
		'_type' in value &&
		typeof value._type === 'string'
	);
}

/**
 * The target fields of an entry, leaving out the ones without a value.
 *
 * @param item - A legacy entry.
 * @returns `linkType`, `link` and `href`, as far as they are set.
 */
function toTarget(item: NavigationItem): Pick<NavigationItem, 'href' | 'link' | 'linkType'> {
	return {
		...(item.href ? { href: item.href } : {}),
		...(item.link ? { link: item.link } : {}),
		...(item.linkType ? { linkType: item.linkType } : {}),
	};
}

/**
 * Whether a legacy entry led anywhere. A missing `linkType` counts as internal, as everywhere else.
 *
 * @param item - A legacy entry.
 * @returns `true` for a page reference, or a URL on an external entry.
 */
function hasTarget(item: NavigationItem): boolean {
	return item.linkType === EXTERNAL_LINK_TYPE ? Boolean(item.href) : Boolean(item.link);
}

/**
 * The former target of an entry with children, as the first child of its menu. It carries the
 * title and sub-text the "Übersicht" link showed.
 *
 * @param item - A legacy entry with children.
 * @returns The child.
 */
function toOverviewChild(item: NavigationItem): NavigationItem {
	const title = item.overviewTitle?.trim() ?? '';
	const description = item.overviewDescription?.trim();
	return {
		_key: `${item._key}-overview`,
		_type: CHILD_TYPE,
		...(description ? { description } : {}),
		...toTarget(item),
		title: title.length > 0 ? title : OVERVIEW_TITLE,
	};
}

/**
 * Turns one entry of the main menu into a link or a menu. An entry with children becomes a menu
 * led by its former target, so no page drops out of the navigation.
 *
 * @param item - An entry of `mainNavigation`.
 * @returns The migrated entry, or the very same object if it is migrated already.
 * @throws {Error} For an entry without a title or of an unknown type, so the migration never writes
 *   a half-converted menu.
 */
function toMenuOrLink(item: NavigationItem): NavigationItem {
	if (item._type === LINK_TYPE || item._type === MENU_TYPE) {
		return item;
	}
	if (item._type !== LEGACY_TYPE) {
		throw new Error(`Der Menüpunkt "${item._key}" hat den unbekannten Typ "${item._type}".`);
	}
	if (!item.title?.trim()) {
		throw new Error(`Der Menüpunkt "${item._key}" hat keine Bezeichnung.`);
	}
	const children = item.children ?? [];
	if (children.length === 0) {
		return { _key: item._key, _type: LINK_TYPE, ...toTarget(item), title: item.title };
	}
	return {
		_key: item._key,
		_type: MENU_TYPE,
		children: [...(hasTarget(item) ? [toOverviewChild(item)] : []), ...children],
		hasTwoColumns: item.hasTwoColumns === true,
		title: item.title,
	};
}

const migration = defineMigration({
	documentTypes: ['site-settings'],
	migrate: {
		document({ mainNavigation }) {
			if (mainNavigation === undefined) {
				return [];
			}
			if (
				!Array.isArray(mainNavigation) ||
				!mainNavigation.every((value) => isNavigationItem(value))
			) {
				throw new Error('Das Hauptmenü hat nicht die erwartete Form.');
			}
			const migrated = mainNavigation.map((item) => toMenuOrLink(item));
			// Everything is migrated already: nothing to patch.
			if (migrated.every((item, index) => item === mainNavigation[index])) {
				return [];
			}
			return [at('mainNavigation', set(migrated))];
		},
	},
	title: 'Das Hauptmenü auf Links und Menüs umstellen',
});

interface NavigationItem {
	_key: string;
	_type: string;
	children?: unknown[];
	description?: string;
	hasTwoColumns?: boolean;
	href?: string;
	link?: { _ref: string; _type: string };
	linkType?: string;
	overviewDescription?: null | string;
	overviewTitle?: null | string;
	title?: string;
}

export default migration;
export { toMenuOrLink };
