import type { SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vite-plus/test';

import { DOSB_ICONS } from '@tsgi-web/shared';

import { CLUB_ICON_NAMES } from '@/utils/preview-icon';

import migration, { getInitialCategoryIcon, ICONS_BY_SLUG } from './index';

type DocumentMigration = (document: SanityDocument) => unknown;

function migrate(fields: Record<string, unknown>): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	// `SanityDocument` names only the system fields; a real document carries its own on top.
	return document({
		_createdAt: '2026-01-01T00:00:00Z',
		_id: 'category',
		_rev: 'rev',
		_type: 'news.category',
		_updatedAt: '2026-01-01T00:00:00Z',
		...fields,
	});
}

describe('news category icons migration', () => {
	it('gives a sport category its pictogram and the club news a club icon', () => {
		expect(getInitialCategoryIcon('fussball')).toBe('Fussball');
		expect(getInitialCategoryIcon('verein')).toBe('Gesamtverein');
	});

	it('leaves a category it does not know without an icon', () => {
		expect(getInitialCategoryIcon('schach')).toBeUndefined();
		expect(getInitialCategoryIcon(null)).toBeUndefined();
		expect(getInitialCategoryIcon(42)).toBeUndefined();
	});

	// An inherited key would hand out a function instead of an icon name.
	it('ignores keys of the object prototype', () => {
		expect(getInitialCategoryIcon('toString')).toBeUndefined();
	});

	it('only writes values the icon field offers', () => {
		expect([...DOSB_ICONS, ...CLUB_ICON_NAMES]).toStrictEqual(
			expect.arrayContaining(Object.values(ICONS_BY_SLUG)),
		);
	});
});

describe('news category icons document migration', () => {
	// `setIfMissing` keeps an icon an editor already chose, so a second run changes nothing.
	it('sets the icon of a known category only where it is missing', () => {
		expect(migrate({ slug: { _type: 'slug', current: 'pr-team' } })).toStrictEqual([
			{ op: { type: 'setIfMissing', value: 'Presse' }, path: ['icon'] },
		]);
	});

	it('patches nothing on a category it does not know or without a slug', () => {
		expect(migrate({ slug: { _type: 'slug', current: 'schach' } })).toStrictEqual([]);
		expect(migrate({})).toStrictEqual([]);
	});
});
