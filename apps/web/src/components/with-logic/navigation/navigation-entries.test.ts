import { describe, expect, it } from 'vite-plus/test';

import { getNavigationEntries } from './navigation-entries';
import type {
	NavigationEntry,
	NavigationGroupEntry,
	NavigationItemData,
	NavigationLink,
	NavigationLinkData,
} from './navigation-entries';

function internal(
	key: string,
	title: string | null,
	target: { slug: string | null; type: string },
): NavigationLinkData {
	return {
		_key: key,
		href: null,
		link: { _type: target.type, category: null, slug: target.slug },
		linkType: 'internal',
		title,
	};
}

function external(key: string, title: string, href: string | null): NavigationLinkData {
	return { _key: key, href, link: null, linkType: 'external', title };
}

function link(data: NavigationLinkData): NavigationItemData {
	return { ...data, _type: 'mainNavigationLink', children: [] };
}

function menu(
	key: string,
	title: string | null,
	children: NavigationLinkData[],
): NavigationItemData {
	return {
		_key: key,
		_type: 'mainNavigationMenu',
		children,
		href: null,
		link: null,
		linkType: null,
		title,
	};
}

/**
 * Asserts that an entry is a group and hands it back typed, so a case needs no conditional.
 *
 * @param entry - The entry under test.
 * @returns The entry as a group.
 */
function asGroup(entry: NavigationEntry | undefined): NavigationGroupEntry {
	expect(entry?.kind).toBe('group');
	return entry as NavigationGroupEntry;
}

/**
 * Asserts that an entry is a plain link and hands back its link.
 *
 * @param entry - The entry under test.
 * @returns The link of the entry.
 */
function asLink(entry: NavigationEntry | undefined): NavigationLink {
	expect(entry?.kind).toBe('link');
	return (entry as Extract<NavigationEntry, { kind: 'link' }>).link;
}

const HOME = internal('home', 'Home', { slug: 'home', type: 'home' });
const VEREIN = internal('verein', 'Verein', { slug: 'verein', type: 'aboutUs' });
const ANGEBOT = internal('angebot', 'Angebot', { slug: 'angebot', type: 'departmentsPage' });
const NEWS = internal('news', 'Aktuelles', { slug: 'news', type: 'newsOverview' });
const FUSSBALL = internal('fussball', 'Fußball', { slug: 'fussball', type: 'news.category' });
const KONTAKT = internal('kontakt', 'Kontakt', { slug: 'kontakt', type: 'contact' });
const NEUWIED = external('neuwied', 'Stadt Neuwied', 'https://www.neuwied.de');

describe('navigation entries', () => {
	describe('plain links', () => {
		it('resolves an internal item through getInternalHref', () => {
			expect(getNavigationEntries([link(VEREIN)], '/')).toStrictEqual([
				{
					kind: 'link',
					link: {
						description: null,
						href: '/verein',
						isActive: false,
						isExternal: false,
						key: 'verein',
						title: 'Verein',
					},
				},
			]);
		});

		it('takes the href of an external item from the data and never marks it active', () => {
			expect(getNavigationEntries([link(NEUWIED)], 'https://www.neuwied.de')).toStrictEqual([
				{
					kind: 'link',
					link: {
						description: null,
						href: 'https://www.neuwied.de',
						isActive: false,
						isExternal: true,
						key: 'neuwied',
						title: 'Stadt Neuwied',
					},
				},
			]);
		});

		// Before the `main-navigation-items` migration no entry carries a `linkType`.
		it('treats an item without link type as internal', () => {
			const [entry] = getNavigationEntries([link({ ...VEREIN, linkType: null })], '/');

			expect(entry).toStrictEqual({
				kind: 'link',
				link: {
					description: null,
					href: '/verein',
					isActive: false,
					isExternal: false,
					key: 'verein',
					title: 'Verein',
				},
			});
		});

		// Switching an entry to external in the studio leaves the hidden page reference behind.
		it('follows the href of an external item even when a stale page reference is left over', () => {
			const [entry] = getNavigationEntries([link({ ...NEUWIED, link: VEREIN.link })], '/verein');

			expect(entry).toStrictEqual({
				kind: 'link',
				link: {
					description: null,
					href: 'https://www.neuwied.de',
					isActive: false,
					isExternal: true,
					key: 'neuwied',
					title: 'Stadt Neuwied',
				},
			});
		});

		it('drops items without a resolvable href or without a title', () => {
			const entries = getNavigationEntries(
				[
					link(internal('no-slug', 'Kontakt', { slug: null, type: 'contact' })),
					link({ ...VEREIN, _key: 'no-link', link: null }),
					link(external('no-href', 'Leer', null)),
					link({ ...VEREIN, _key: 'no-title', title: null }),
					link(ANGEBOT),
				],
				'/',
			);

			expect(entries.map((entry) => asLink(entry).key)).toStrictEqual(['angebot']);
		});
	});

	describe('active state', () => {
		it('matches the home page only exactly', () => {
			const [onHome] = getNavigationEntries([link(HOME)], '/');
			const [elsewhere] = getNavigationEntries([link(HOME)], '/verein');

			expect(asLink(onHome).isActive).toBe(true);
			expect(asLink(elsewhere).isActive).toBe(false);
		});

		it('marks an item active on a page below it', () => {
			const [entry] = getNavigationEntries([link(ANGEBOT)], '/angebot/fussball');

			expect(asLink(entry).isActive).toBe(true);
		});

		it('does not match a page that merely starts with the same letters', () => {
			const [entry] = getNavigationEntries([link(NEWS)], '/newsletter');

			expect(asLink(entry).isActive).toBe(false);
		});
	});

	describe('dropdown texts and columns', () => {
		it('passes the description of a child through', () => {
			const entry = asGroup(
				getNavigationEntries(
					[menu('verein', 'Verein', [VEREIN, { ...KONTAKT, description: 'So erreichst du uns' }])],
					'/',
				)[0],
			);

			expect(entry.links.map((entryLink) => entryLink.description)).toStrictEqual([
				null,
				'So erreichst du uns',
			]);
		});

		it('renders a menu in one column unless it asks for two', () => {
			const [oneColumn, twoColumns] = getNavigationEntries(
				[
					menu('verein', 'Verein', [KONTAKT]),
					{ ...menu('news', 'Aktuelles', [FUSSBALL]), hasTwoColumns: true },
				],
				'/',
			);

			expect(asGroup(oneColumn).hasTwoColumns).toBe(false);
			expect(asGroup(twoColumns).hasTwoColumns).toBe(true);
		});
	});

	describe('menus', () => {
		// WEB-371: a menu has no target of its own, so nothing is added in front of its children.
		it('lists exactly its children, in their order', () => {
			const [entry] = getNavigationEntries(
				[menu('verein', 'Verein', [VEREIN, KONTAKT, NEUWIED])],
				'/',
			);

			expect(entry).toStrictEqual({
				hasTwoColumns: false,
				isActive: false,
				key: 'verein',
				kind: 'group',
				links: [
					{
						description: null,
						href: '/verein',
						isActive: false,
						isExternal: false,
						key: 'verein',
						title: 'Verein',
					},
					{
						description: null,
						href: '/kontakt',
						isActive: false,
						isExternal: false,
						key: 'kontakt',
						title: 'Kontakt',
					},
					{
						description: null,
						href: 'https://www.neuwied.de',
						isActive: false,
						isExternal: true,
						key: 'neuwied',
						title: 'Stadt Neuwied',
					},
				],
				title: 'Verein',
			});
		});

		// Review focus 2.
		it('drops a menu none of whose children can be resolved', () => {
			const broken = internal('broken', 'Kaputt', { slug: null, type: 'contact' });

			expect(getNavigationEntries([menu('verein', 'Verein', [broken])], '/')).toStrictEqual([]);
		});

		it('drops a menu without a title, since its trigger would have no label', () => {
			expect(getNavigationEntries([menu('verein', null, [KONTAKT])], '/')).toStrictEqual([]);
		});

		it('marks only the longest matching child active', () => {
			const [entry] = getNavigationEntries(
				[menu('news', 'Aktuelles', [NEWS, FUSSBALL])],
				'/news/fussball',
			);

			expect(asGroup(entry).isActive).toBe(true);
			expect(
				asGroup(entry).links.map((entryLink) => [entryLink.title, entryLink.isActive]),
			).toStrictEqual([
				['Aktuelles', false],
				['Fußball', true],
			]);
		});

		it('marks the menu active through any of its children', () => {
			const [entry] = getNavigationEntries([menu('verein', 'Verein', [KONTAKT])], '/kontakt');

			expect(asGroup(entry).isActive).toBe(true);
		});

		it('leaves the menu inactive when none of its children matches', () => {
			const [entry] = getNavigationEntries([menu('verein', 'Verein', [KONTAKT])], '/angebot');

			expect(asGroup(entry).isActive).toBe(false);
		});
	});

	// Review focus 1: production keeps the old type until the operator migrates at the release.
	describe('entries not migrated yet', () => {
		it('renders an old entry as a link, also when it still has children', () => {
			const [entry] = getNavigationEntries(
				[{ ...VEREIN, _type: 'mainNavigationItem', children: [KONTAKT] }],
				'/',
			);

			expect(asLink(entry)).toMatchObject({ href: '/verein', title: 'Verein' });
		});
	});
});
