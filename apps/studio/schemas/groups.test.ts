import { describe, expect, it, vi } from 'vite-plus/test';

import type { NamedImageInput } from '@/components/named-image-input';

import { schemaTypes } from '.';

// `NamedImageInput` pulls in `sanity-plugin-media`, which breaks under Vitest, and reads studio-only
// environment variables; neither matters for the tabs of a document (see `objects/meta.test.ts`).
vi.mock(import('@/components/named-image-input'), () => ({
	NamedImageInput: (() => null) as unknown as typeof NamedImageInput,
}));

interface Group {
	readonly name: string;
	readonly title?: string;
}

interface Field {
	readonly group?: string | readonly string[];
	readonly name: string;
}

interface DocumentType {
	readonly fields: readonly Field[];
	readonly groups?: readonly Group[];
	readonly name: string;
	readonly type: string;
}

interface TabbedDocumentType extends DocumentType {
	readonly groups: readonly Group[];
}

/** Words the tabs carried before WEB-428, next to German ones such as „Inhalt“. */
const ENGLISH_TITLES: ReadonlySet<string> = new Set([
	'General',
	'Meta information',
	'Misc',
	'Social',
	'Stats',
]);

/**
 * Checks whether a document shows tabs above its form.
 *
 * @param type - The document type.
 * @returns `true` if it declares at least one tab.
 */
function hasTabs(type: DocumentType): type is TabbedDocumentType {
	return (type.groups?.length ?? 0) > 0;
}

/**
 * Lists the tabs a field is shown in.
 *
 * @param field - The field of a document.
 * @returns The names of its tabs, empty when it has none.
 */
function getFieldGroups(field: Field): readonly string[] {
	if (field.group === undefined) {
		return [];
	}
	return typeof field.group === 'string' ? [field.group] : field.group;
}

/**
 * Returns the label of a tab as the studio shows it.
 *
 * @param group - The tab.
 * @returns Its title, or its name without one.
 */
function getGroupTitle(group: Group): string {
	return group.title ?? group.name;
}

const DOCUMENTS = (schemaTypes as unknown as readonly DocumentType[]).filter(
	(type) => type.type === 'document',
);
const TABBED = DOCUMENTS.filter((type) => hasTabs(type));
const UNTABBED = DOCUMENTS.filter((type) => !hasTabs(type));
const TABBED_WITH_SEO = TABBED.filter((type) => type.groups.some((group) => group.name === 'meta'));

describe('document tabs', () => {
	it('finds the tabbed documents', () => {
		expect(TABBED.map((type) => type.name)).toStrictEqual(
			expect.arrayContaining(['department', 'group', 'home', 'news.article']),
		);
	});

	// A field outside every tab only shows under "Alle Felder" and is easily missed.
	it.each(TABBED.map((type) => [type.name, type]))(
		'puts every field of %s into one of its tabs',
		(_name, type) => {
			const names = new Set(type.groups.map((group) => group.name));
			const misplaced = type.fields
				.filter((field) => !getFieldGroups(field).some((group) => names.has(group)))
				.map((field) => field.name);

			expect(misplaced).toStrictEqual([]);
		},
	);

	it.each(TABBED.map((type) => [type.name, type]))('leaves no tab of %s empty', (_name, type) => {
		const used = new Set(type.fields.flatMap((field) => getFieldGroups(field)));
		const empty = type.groups.filter((group) => !used.has(group.name)).map((group) => group.name);

		expect(empty).toStrictEqual([]);
	});

	// One tab next to "Alle Felder" only costs a click.
	it.each(TABBED.map((type) => [type.name, type]))('gives %s at least two tabs', (_name, type) => {
		expect(type.groups.length).toBeGreaterThan(1);
	});

	it.each(TABBED_WITH_SEO.map((type) => [type.name, type]))(
		'puts the SEO tab of %s last, behind the content',
		(_name, type) => {
			expect(type.groups.at(-1)?.name).toBe('meta');
		},
	);

	// A shared field brings its tab along (`group: 'general'`), which a document without tabs has to
	// strip with `getFieldWithoutGroup`; the studio refuses a field that names an unknown tab.
	it('leaves no field of an untabbed document pointing at a tab', () => {
		const pointing = UNTABBED.flatMap((type) =>
			type.fields
				.filter((field) => getFieldGroups(field).length > 0)
				.map((field) => `${type.name}.${field.name}`),
		);

		expect(pointing).toStrictEqual([]);
	});

	// The studio speaks German; "General" and "Meta information" stood next to "Inhalt" (WEB-428).
	it.each(TABBED.map((type) => [type.name, type]))(
		'titles every tab of %s in German',
		(_name, type) => {
			const titles = type.groups.map((group) => getGroupTitle(group));

			expect(titles.filter((title) => ENGLISH_TITLES.has(title))).toStrictEqual([]);
		},
	);
});
