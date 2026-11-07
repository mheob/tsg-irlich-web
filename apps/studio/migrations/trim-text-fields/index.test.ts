import type { MigrationContext, Path } from 'sanity/migrate';
import { describe, expect, it } from 'vite-plus/test';

import migration, { getCleanedValue } from './index';

type StringMigration = (node: string, path: Path, context: MigrationContext) => unknown;

function visit(value: string, path: Path): unknown {
	const { string } = migration.migrate as { string: StringMigration };
	return string(value, path, {} as MigrationContext);
}

describe('cleaning titles and names', () => {
	it('trims a title on the document', () => {
		expect(getCleanedValue('Heimsieg gegen Engers ', ['title'])).toBe('Heimsieg gegen Engers');
	});

	it('cleans a title inside a section or a stat', () => {
		expect(getCleanedValue('Sweet Diamonds ', ['body', { _key: 'a1' }, 'title'])).toBe(
			'Sweet Diamonds',
		);
		expect(getCleanedValue('aktive Sportler ', ['stats', 0, 'title'])).toBe('aktive Sportler');
	});

	it('collapses doubled spaces in names', () => {
		expect(getCleanedValue('Melanie  Klein', ['firstName'])).toBe('Melanie Klein');
		expect(getCleanedValue('Mäckler ', ['lastName'])).toBe('Mäckler');
	});

	it('keeps the paragraphs of an excerpt', () => {
		expect(getCleanedValue('Erster Satz.  Zweiter Satz.\n\nNeuer Absatz. ', ['excerpt'])).toBe(
			'Erster Satz. Zweiter Satz.\n\nNeuer Absatz.',
		);
	});

	it('leaves other strings alone', () => {
		expect(
			getCleanedValue('text  with  spaces ', ['body', 0, 'children', 0, 'text']),
		).toBeUndefined();
		expect(getCleanedValue('Heimsieg ', ['slug', 'current'])).toBeUndefined();
	});

	it('changes nothing on a clean value', () => {
		expect(getCleanedValue('Melanie Klein', ['firstName'])).toBeUndefined();
	});
});

describe('the migration', () => {
	it('sets the cleaned value', () => {
		expect(visit('PR-Team ', ['title'])).toStrictEqual({ type: 'set', value: 'PR-Team' });
	});

	it('returns nothing for a clean value, so a second run is a no-op', () => {
		expect(visit('PR-Team', ['title'])).toBeUndefined();
	});

	it('skips asset and system documents', () => {
		expect(migration.filter).toBe('!(_type match "sanity.*") && !(_type match "system.*")');
	});
});
