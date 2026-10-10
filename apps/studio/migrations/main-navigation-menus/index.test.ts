import { at, set } from 'sanity/migrate';
import type { SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vite-plus/test';

import migration, { toMenuOrLink } from './index';

type DocumentMigration = (document: SanityDocument) => unknown;

function migrate(mainNavigation?: unknown): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	return document({
		_createdAt: '2026-01-01T00:00:00Z',
		_id: 'site-settings',
		_rev: 'rev',
		_type: 'site-settings',
		_updatedAt: '2026-01-01T00:00:00Z',
		mainNavigation,
	} as SanityDocument);
}

const ABOUT_US = { _ref: 'aboutUs', _type: 'reference' };
const ECHO = { _ref: 'echoOverview', _type: 'reference' };
const ECHO_CHILD = {
	_key: 'echo',
	_type: 'navigationLink',
	link: ECHO,
	linkType: 'internal',
	title: 'TSG Echo',
};

const LEGACY_HOME = {
	_key: 'home',
	_type: 'mainNavigationItem',
	link: { _ref: 'home', _type: 'reference' },
	linkType: 'internal',
	title: 'Home',
};

// The "Verein" entry of `development` on 2026-10-10.
const LEGACY_VEREIN = {
	_key: 'verein',
	_type: 'mainNavigationItem',
	children: [ECHO_CHILD],
	hasTwoColumns: false,
	link: ABOUT_US,
	linkType: 'internal',
	overviewDescription: 'Wer wir sind und wofür wir stehen',
	overviewTitle: 'Über uns',
	title: 'Verein',
};

describe('moving the main menu to links and menus', () => {
	// Review focus 4.
	it.each([
		{
			_key: 'home',
			_type: 'mainNavigationLink',
			link: LEGACY_HOME.link,
			linkType: 'internal',
			title: 'Home',
		},
		{ _key: 'verein', _type: 'mainNavigationMenu', children: [ECHO_CHILD], title: 'Verein' },
	])('leaves a $_type unchanged', (item) => {
		expect(toMenuOrLink(item)).toBe(item);
	});

	it('turns an entry without children into a link and drops the dropdown fields', () => {
		expect(
			toMenuOrLink({ ...LEGACY_HOME, children: [], hasTwoColumns: false, overviewTitle: 'x' }),
		).toStrictEqual({
			_key: 'home',
			_type: 'mainNavigationLink',
			link: LEGACY_HOME.link,
			linkType: 'internal',
			title: 'Home',
		});
	});

	it('keeps an external entry external', () => {
		expect(
			toMenuOrLink({
				_key: 'stadt',
				_type: 'mainNavigationItem',
				href: 'https://www.neuwied.de',
				linkType: 'external',
				title: 'Stadt',
			}),
		).toStrictEqual({
			_key: 'stadt',
			_type: 'mainNavigationLink',
			href: 'https://www.neuwied.de',
			linkType: 'external',
			title: 'Stadt',
		});
	});

	it('turns an entry with children into a menu led by its former target', () => {
		expect(toMenuOrLink(LEGACY_VEREIN)).toStrictEqual({
			_key: 'verein',
			_type: 'mainNavigationMenu',
			children: [
				{
					_key: 'verein-overview',
					_type: 'navigationLink',
					description: 'Wer wir sind und wofür wir stehen',
					link: ABOUT_US,
					linkType: 'internal',
					title: 'Über uns',
				},
				ECHO_CHILD,
			],
			hasTwoColumns: false,
			title: 'Verein',
		});
	});

	// Review focus 3.
	it.each([undefined, null, '', '   '])(
		'titles the former target "Übersicht" when the overview title is %j',
		(overviewTitle) => {
			const menu = toMenuOrLink({
				...LEGACY_VEREIN,
				overviewDescription: undefined,
				overviewTitle,
			});

			expect(menu.children?.[0]).toStrictEqual({
				_key: 'verein-overview',
				_type: 'navigationLink',
				link: ABOUT_US,
				linkType: 'internal',
				title: 'Übersicht',
			});
		},
	);

	it('keeps an external former target external', () => {
		const menu = toMenuOrLink({
			...LEGACY_VEREIN,
			href: 'https://www.tsg-irlich.de',
			link: undefined,
			linkType: 'external',
			overviewDescription: undefined,
		});

		expect(menu.children?.[0]).toStrictEqual({
			_key: 'verein-overview',
			_type: 'navigationLink',
			href: 'https://www.tsg-irlich.de',
			linkType: 'external',
			title: 'Über uns',
		});
	});

	it('adds no child for an entry that had no target', () => {
		expect(toMenuOrLink({ ...LEGACY_VEREIN, link: undefined }).children).toStrictEqual([
			ECHO_CHILD,
		]);
	});

	it('refuses an entry without a title', () => {
		expect(() => toMenuOrLink({ ...LEGACY_HOME, title: ' ' })).toThrow(
			'Der Menüpunkt "home" hat keine Bezeichnung.',
		);
	});

	it('refuses an unknown type', () => {
		expect(() => toMenuOrLink({ _key: 'x', _type: 'internalLink', title: 'X' })).toThrow(
			'Der Menüpunkt "x" hat den unbekannten Typ "internalLink".',
		);
	});
});

describe('the document migration', () => {
	it('rewrites the whole menu when an entry changed', () => {
		const migrated = [toMenuOrLink(LEGACY_HOME), toMenuOrLink(LEGACY_VEREIN)];

		expect(migrate([LEGACY_HOME, LEGACY_VEREIN])).toStrictEqual([
			at('mainNavigation', set(migrated)),
		]);
	});

	// Review focus 4: a second run writes nothing.
	it('leaves a migrated menu alone', () => {
		expect(migrate([toMenuOrLink(LEGACY_HOME), toMenuOrLink(LEGACY_VEREIN)])).toStrictEqual([]);
	});

	it('leaves a document without a menu alone', () => {
		expect(migrate()).toStrictEqual([]);
	});

	it('refuses a menu that is not a list of entries', () => {
		expect(() => migrate([{ title: 'ohne Schlüssel' }])).toThrow(
			'Das Hauptmenü hat nicht die erwartete Form.',
		);
	});
});
