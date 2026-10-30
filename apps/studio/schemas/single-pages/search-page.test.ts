import { describe, expect, it, vi } from 'vite-plus/test';

import type { NamedImageInput } from '@/components/named-image-input';

import searchPage from './search-page';

// `metaField` wires the open graph image to `NamedImageInput`, which pulls in `sanity-plugin-media`
// and the Studio-only env variables. Neither matters for the schema under test, so the component
// is stubbed, as in `schemas/objects/meta.test.ts`.
vi.mock(import('@/components/named-image-input'), () => ({
	NamedImageInput: (() => null) as unknown as typeof NamedImageInput,
}));

interface SchemaField {
	description?: string;
	fields?: SchemaField[];
	group?: string;
	initialValue?: unknown;
	name: string;
	of?: { type: string }[];
	options?: { layout?: string };
	readOnly?: boolean;
	type: string;
	validation?: (rule: FakeRule) => unknown;
}

/**
 * A fake `Rule` whose `required().error(message)` hands back the message, so a section's
 * validation function returns the list of required errors it declares.
 */
interface FakeRule {
	required: () => { error: (message: string) => string };
}

const fakeRule: FakeRule = { required: () => ({ error: (message) => message }) };

const fields = searchPage.fields as unknown as SchemaField[];

function field(name: string): SchemaField | undefined {
	return fields.find((candidate) => candidate.name === name);
}

function names(list: readonly SchemaField[] | undefined): string[] {
	return (list ?? []).map((candidate) => candidate.name);
}

function contentField(name: string): SchemaField | undefined {
	return field('content')?.fields?.find((candidate) => candidate.name === name);
}

function nestedField(section: string, name: string): SchemaField | undefined {
	return contentField(section)?.fields?.find((candidate) => candidate.name === name);
}

describe('search page', () => {
	// The page lives at /suche; editors must not be able to move it.
	it('fixes its slug to suche', () => {
		expect(field('slug')).toMatchObject({ initialValue: { current: 'suche' }, readOnly: true });
	});

	it('offers the hero, the meta and the content fields', () => {
		expect(names(fields)).toStrictEqual([
			'slug',
			'title',
			'subtitle',
			'heroImage',
			'meta',
			'content',
		]);
	});

	it('puts the hero image into the general group', () => {
		expect(field('heroImage')).toMatchObject({ group: 'general', type: 'extendedImage' });
	});

	it('splits the content into one field per editable area', () => {
		expect(names(field('content')?.fields)).toStrictEqual([
			'searchSection',
			'noResults',
			'popularSearches',
			'contactPersonsSection',
		]);
	});

	it('reads the placeholder of the search field as a string', () => {
		expect(nestedField('searchSection', 'placeholder')).toMatchObject({
			description: 'Erscheint im Suchfeld der Suchseite und des Such-Panels in der Navigation.',
			title: 'Platzhalter im Suchfeld',
			type: 'string',
		});
	});

	it('keeps the default section fields in front of the placeholder', () => {
		expect(names(contentField('searchSection')?.fields)).toStrictEqual([
			'title',
			'subtitle',
			'intro',
			'placeholder',
		]);
	});

	it('lets editors write the empty state as title, text and links', () => {
		expect(names(contentField('noResults')?.fields)).toStrictEqual(['title', 'text', 'links']);
		expect(nestedField('noResults', 'text')).toMatchObject({ type: 'simpleBlockContent' });
	});

	it('offers navigation links in the empty state', () => {
		const links = nestedField('noResults', 'links');

		expect(links).toMatchObject({ type: 'array' });
		expect(links?.of?.map((member) => member.type)).toStrictEqual(['navigationLink']);
	});

	it('titles the popular searches “Häufig gesucht” by default', () => {
		expect(nestedField('popularSearches', 'title')).toMatchObject({
			initialValue: 'Häufig gesucht',
			type: 'string',
		});
	});

	it.each([
		[
			'pinnedTerms',
			'Immer anzeigen',
			'Diese Begriffe stehen immer in der Liste „Häufig gesucht“, vor den automatisch ermittelten. Solange noch zu wenige Suchen gezählt sind, füllen sie die Liste allein.',
		],
		[
			'blockedTerms',
			'Nie anzeigen',
			'Diese Begriffe erscheinen nie in „Häufig gesucht“, auch wenn sie oft gesucht werden.',
		],
	])('keeps %s as a list of tags', (name, title, description) => {
		const terms = nestedField('popularSearches', name);

		expect(terms).toMatchObject({ description, title, type: 'array' });
		expect(terms?.options).toStrictEqual({ layout: 'tags' });
		expect(terms?.of?.map((member) => member.type)).toStrictEqual(['string']);
	});

	// Sanity skips the validators of a nested field while its object is missing, so the required
	// fields inside a section only count once the section itself is required.
	it.each([
		['searchSection', 'Der Suchbereich ist erforderlich'],
		['noResults', 'Der Bereich „Keine Treffer“ ist erforderlich'],
	])('requires the section %s', (name, message) => {
		expect(contentField(name)?.validation?.(fakeRule)).toStrictEqual([message]);
	});

	it('leaves the popular searches optional', () => {
		expect(contentField('popularSearches')?.validation).toBeUndefined();
	});

	it('keeps the contact persons section in the content', () => {
		expect(contentField('contactPersonsSection')).toMatchObject({
			group: 'contactPersons',
			type: 'object',
		});
	});

	it('shows a fixed title in lists', () => {
		expect(searchPage.preview.prepare()).toStrictEqual({ title: 'Suche' });
	});
});
