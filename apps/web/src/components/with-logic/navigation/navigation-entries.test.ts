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

function item(data: NavigationLinkData, children: NavigationLinkData[] = []): NavigationItemData {
	return { ...data, children };
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
			expect(getNavigationEntries([item(VEREIN)], '/')).toStrictEqual([
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
			expect(getNavigationEntries([item(NEUWIED)], 'https://www.neuwied.de')).toStrictEqual([
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
			const [entry] = getNavigationEntries([item({ ...VEREIN, linkType: null })], '/');

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
			const [entry] = getNavigationEntries([item({ ...NEUWIED, link: VEREIN.link })], '/verein');

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
					item(internal('no-slug', 'Kontakt', { slug: null, type: 'contact' })),
					item({ ...VEREIN, _key: 'no-link', link: null }),
					item(external('no-href', 'Leer', null)),
					item({ ...VEREIN, _key: 'no-title', title: null }),
					item(ANGEBOT),
				],
				'/',
			);

			expect(entries.map((entry) => asLink(entry).key)).toStrictEqual(['angebot']);
		});
	});

	describe('dropdown texts and columns', () => {
		it('passes the description of a sub-entry through', () => {
			const entry = asGroup(
				getNavigationEntries(
					[item(VEREIN, [{ ...KONTAKT, description: 'So erreichst du uns' }])],
					'/',
				)[0],
			);

			expect(entry.links.map((link) => link.description)).toStrictEqual([
				null,
				'So erreichst du uns',
			]);
		});

		it('titles and describes the overview with the fields of its item', () => {
			const entry = asGroup(
				getNavigationEntries(
					[
						{
							...item(VEREIN, [KONTAKT]),
							overviewDescription: 'Alles über die TSG',
							overviewTitle: 'Unser Verein',
						},
					],
					'/',
				)[0],
			);

			expect(entry.links[0]).toMatchObject({
				description: 'Alles über die TSG',
				title: 'Unser Verein',
			});
		});

		it.each([undefined, null, '', '   '])(
			'falls back to "Übersicht" when the overview title is %j',
			(overviewTitle) => {
				const entry = asGroup(
					getNavigationEntries([{ ...item(VEREIN, [KONTAKT]), overviewTitle }], '/')[0],
				);

				expect(entry.links[0]?.title).toBe('Übersicht');
			},
		);

		it('renders a group in one column unless its item asks for two', () => {
			const [oneColumn, twoColumns] = getNavigationEntries(
				[item(VEREIN, [KONTAKT]), { ...item(NEWS, [FUSSBALL]), hasTwoColumns: true }],
				'/',
			);

			expect(asGroup(oneColumn).hasTwoColumns).toBe(false);
			expect(asGroup(twoColumns).hasTwoColumns).toBe(true);
		});
	});

	describe('active state', () => {
		it('matches the home page only exactly', () => {
			const [onHome] = getNavigationEntries([item(HOME)], '/');
			const [elsewhere] = getNavigationEntries([item(HOME)], '/verein');

			expect(asLink(onHome).isActive).toBe(true);
			expect(asLink(elsewhere).isActive).toBe(false);
		});

		it('marks an item active on a page below it', () => {
			const [entry] = getNavigationEntries([item(ANGEBOT)], '/angebot/fussball');

			expect(asLink(entry).isActive).toBe(true);
		});

		it('does not match a page that merely starts with the same letters', () => {
			const [entry] = getNavigationEntries([item(NEWS)], '/newsletter');

			expect(asLink(entry).isActive).toBe(false);
		});
	});

	describe('groups', () => {
		it('puts "Übersicht" for the parent page first, then the children in their order', () => {
			const [entry] = getNavigationEntries([item(VEREIN, [KONTAKT, NEUWIED])], '/');

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
						key: 'verein-overview',
						title: 'Übersicht',
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

		it('keeps the children but leaves out "Übersicht" when the parent page cannot be resolved', () => {
			const [entry] = getNavigationEntries([item({ ...VEREIN, link: null }, [KONTAKT])], '/');

			expect(asGroup(entry).links.map((link) => link.title)).toStrictEqual(['Kontakt']);
		});

		it('falls back to a plain link when none of the children can be resolved', () => {
			const [entry] = getNavigationEntries(
				[item(VEREIN, [internal('broken', 'Kaputt', { slug: null, type: 'contact' })])],
				'/',
			);

			expect(entry.kind).toBe('link');
		});

		it('drops a group without a title, since its trigger would have no label', () => {
			expect(
				getNavigationEntries([item({ ...VEREIN, title: null }, [KONTAKT])], '/'),
			).toStrictEqual([]);
		});

		it('marks only the longest matching link active, so a child beats "Übersicht"', () => {
			const [entry] = getNavigationEntries([item(NEWS, [FUSSBALL])], '/news/fussball');

			expect(asGroup(entry).isActive).toBe(true);
			expect(asGroup(entry).links.map((link) => [link.title, link.isActive])).toStrictEqual([
				['Übersicht', false],
				['Fußball', true],
			]);
		});

		it('marks "Übersicht" active on the parent page itself', () => {
			const [entry] = getNavigationEntries([item(NEWS, [FUSSBALL])], '/news');

			expect(asGroup(entry).links.map((link) => [link.title, link.isActive])).toStrictEqual([
				['Übersicht', true],
				['Fußball', false],
			]);
		});

		it('marks the group active through a child that lives elsewhere', () => {
			const [entry] = getNavigationEntries([item(VEREIN, [KONTAKT])], '/kontakt');

			expect(asGroup(entry).isActive).toBe(true);
		});

		it('gives exactly one link aria-current when a child points at the parent page', () => {
			const [entry] = getNavigationEntries(
				[item(VEREIN, [{ ...VEREIN, _key: 'verein-copy', title: 'Über uns' }])],
				'/verein',
			);

			expect(asGroup(entry).links.map((link) => [link.title, link.isActive])).toStrictEqual([
				['Übersicht', true],
				['Über uns', false],
			]);
		});

		it('leaves the group inactive when none of its links matches', () => {
			const [entry] = getNavigationEntries([item(VEREIN, [KONTAKT])], '/angebot');

			expect(asGroup(entry).isActive).toBe(false);
		});
	});
});
