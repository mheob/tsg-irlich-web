import type { SanityDocument } from 'sanity/migrate';
import { describe, expect, it } from 'vite-plus/test';

import migration, { getLowercaseSlugPatch } from './index';

type DocumentMigration = (document: SanityDocument) => unknown;

function migrate(fields: Record<string, unknown>): unknown {
	const { document } = migration.migrate as { document: DocumentMigration };

	// `SanityDocument` names only the system fields; a real document carries its own on top.
	return document({
		_createdAt: '2026-01-01T00:00:00Z',
		_id: 'article',
		_rev: 'rev',
		_type: 'news.article',
		_updatedAt: '2026-01-01T00:00:00Z',
		...fields,
	});
}

describe('lowercase news article slugs', () => {
	it('lowercases the slug and remembers the old one', () => {
		expect(getLowercaseSlugPatch('Einladung-JHV-2026')).toStrictEqual({
			previousSlugs: ['Einladung-JHV-2026'],
			slug: 'einladung-jhv-2026',
		});
	});

	it('keeps the former slugs recorded so far', () => {
		expect(getLowercaseSlugPatch('niederlage-heimbach-II', ['niederlage-heimbach'])).toStrictEqual({
			previousSlugs: ['niederlage-heimbach', 'niederlage-heimbach-II'],
			slug: 'niederlage-heimbach-ii',
		});
	});

	it('drops the new slug from the history, since it is current again', () => {
		expect(getLowercaseSlugPatch('Besuch-ehc-neuwied', ['besuch-ehc-neuwied'])).toStrictEqual({
			previousSlugs: ['Besuch-ehc-neuwied'],
			slug: 'besuch-ehc-neuwied',
		});
	});

	it('never records the old slug twice', () => {
		expect(
			getLowercaseSlugPatch('Diamonds-Niederbreitbach', ['Diamonds-Niederbreitbach']),
		).toStrictEqual({
			previousSlugs: ['Diamonds-Niederbreitbach'],
			slug: 'diamonds-niederbreitbach',
		});
	});

	it('leaves a lowercase slug and a missing one alone', () => {
		expect(getLowercaseSlugPatch('heimsieg-engers')).toBeUndefined();
		expect(getLowercaseSlugPatch(null)).toBeUndefined();
	});

	it('ignores entries of the history that are no strings', () => {
		expect(getLowercaseSlugPatch('Heimsieg-weissenthurm-ii', [42, 'alt'])).toStrictEqual({
			previousSlugs: ['alt', 'Heimsieg-weissenthurm-ii'],
			slug: 'heimsieg-weissenthurm-ii',
		});
	});

	it('patches the slug and the history of an article with capitals', () => {
		expect(migrate({ slug: { _type: 'slug', current: 'Anmeldung-skitour-2027' } })).toStrictEqual([
			expect.objectContaining({ path: ['slug', 'current'] }),
			expect.objectContaining({ path: ['previousSlugs'] }),
		]);
	});

	it('patches nothing on an article that is already lowercase, so a second run changes nothing', () => {
		expect(migrate({ slug: { _type: 'slug', current: 'anmeldung-skitour-2027' } })).toStrictEqual(
			[],
		);
		expect(migrate({})).toStrictEqual([]);
	});
});
