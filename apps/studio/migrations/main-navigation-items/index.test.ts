import { at, set } from 'sanity/migrate';
import type { SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vitest';

import migration, { toMainNavigationItem } from './index';

type DocumentMigration = (document: SanityDocument) => unknown;

function migrate(mainNavigation?: unknown): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	// `SanityDocument` names only the system fields; a real document carries its own on top.
	return document({
		_createdAt: '2026-01-01T00:00:00Z',
		_id: 'site-settings',
		_rev: 'rev',
		_type: 'site-settings',
		_updatedAt: '2026-01-01T00:00:00Z',
		mainNavigation,
	} as SanityDocument);
}

const VEREIN_REFERENCE = { _ref: 'aboutUs', _type: 'reference' };

const LEGACY_INTERNAL = {
	_key: '3ec68f9c2d7e',
	_type: 'internalLink',
	link: VEREIN_REFERENCE,
	title: 'Verein',
};

const MIGRATED_INTERNAL = {
	_key: '3ec68f9c2d7e',
	_type: 'mainNavigationItem',
	link: VEREIN_REFERENCE,
	linkType: 'internal',
	title: 'Verein',
};

describe('moving the main navigation to its own item type', () => {
	it('turns an internal link into an internal main navigation item', () => {
		expect(toMainNavigationItem(LEGACY_INTERNAL)).toStrictEqual(MIGRATED_INTERNAL);
	});

	it('turns an external link into an external main navigation item', () => {
		expect(
			toMainNavigationItem({
				_key: 'neuwied',
				_type: 'externalLink',
				href: 'https://www.neuwied.de',
				title: 'Stadt Neuwied',
			}),
		).toStrictEqual({
			_key: 'neuwied',
			_type: 'mainNavigationItem',
			href: 'https://www.neuwied.de',
			linkType: 'external',
			title: 'Stadt Neuwied',
		});
	});

	it('leaves an item that is already migrated untouched, children included', () => {
		const item = { ...MIGRATED_INTERNAL, children: [{ _key: 'child', _type: 'navigationLink' }] };

		expect(toMainNavigationItem(item)).toBe(item);
	});

	it.each([undefined, '', '   '])('refuses an entry whose title is %j', (title) => {
		expect(() => toMainNavigationItem({ ...LEGACY_INTERNAL, title })).toThrow(
			'Der Menüpunkt "3ec68f9c2d7e" hat keine Bezeichnung.',
		);
	});

	it('refuses an entry of an unknown type', () => {
		expect(() => toMainNavigationItem({ ...LEGACY_INTERNAL, _type: 'button' })).toThrow(
			'Der Menüpunkt "3ec68f9c2d7e" hat den unbekannten Typ "button".',
		);
	});

	it('rewrites the whole menu when at least one entry is still a legacy link', () => {
		expect(migrate([LEGACY_INTERNAL])).toStrictEqual([
			at('mainNavigation', set([MIGRATED_INTERNAL])),
		]);
	});

	it('patches nothing once every entry is migrated, so it can run again safely', () => {
		expect(migrate([MIGRATED_INTERNAL])).toStrictEqual([]);
	});

	it('patches nothing when the document has no main navigation', () => {
		expect(migrate()).toStrictEqual([]);
	});

	it('refuses a main navigation that is not a list of entries', () => {
		expect(() => migrate([{ title: 'kein Schlüssel' }])).toThrow(
			'Das Hauptmenü hat nicht die erwartete Form.',
		);
	});
});
