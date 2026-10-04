import { at, defineMigration, set } from 'sanity/migrate';

const MAIN_NAVIGATION_ITEM_TYPE = 'mainNavigationItem';

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
 * Turns one entry of the old main navigation into a `mainNavigationItem`. The field names stay the
 * same, so only `_type` changes and `linkType` is added.
 *
 * @param item - An `internalLink`, `externalLink` or already migrated `mainNavigationItem`.
 * @returns The migrated entry, or the very same object if it is migrated already.
 * @throws {Error} When the entry has no title or an unknown type, so the migration never writes a
 *   half-converted menu.
 */
function toMainNavigationItem(item: NavigationItem): NavigationItem {
	if (item._type === MAIN_NAVIGATION_ITEM_TYPE) {
		return item;
	}

	if (!item.title?.trim()) {
		throw new Error(`Der Menüpunkt "${item._key}" hat keine Bezeichnung.`);
	}

	if (item._type === 'internalLink') {
		return {
			_key: item._key,
			_type: MAIN_NAVIGATION_ITEM_TYPE,
			link: item.link,
			linkType: 'internal',
			title: item.title,
		};
	}

	if (item._type === 'externalLink') {
		return {
			_key: item._key,
			_type: MAIN_NAVIGATION_ITEM_TYPE,
			href: item.href,
			linkType: 'external',
			title: item.title,
		};
	}

	throw new Error(`Der Menüpunkt "${item._key}" hat den unbekannten Typ "${item._type}".`);
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

			const migrated = mainNavigation.map((item) => toMainNavigationItem(item));

			// Everything is migrated already: nothing to patch.
			if (migrated.every((item, index) => item === mainNavigation[index])) {
				return [];
			}

			return [at('mainNavigation', set(migrated))];
		},
	},
	title: 'Die Einträge des Hauptmenüs auf den Typ mainNavigationItem umstellen',
});

interface NavigationItem {
	_key: string;
	_type: string;
	children?: unknown[];
	href?: string;
	link?: { _ref: string; _type: string };
	linkType?: string;
	title?: string;
}

export default migration;
export { toMainNavigationItem };
