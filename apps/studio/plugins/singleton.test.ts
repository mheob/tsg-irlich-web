import type { DocumentDefinition } from 'sanity';
import type { StructureBuilder, StructureResolverContext } from 'sanity/structure';
import { describe, expect, it } from 'vite-plus/test';

import { pageStructure, singletonPlugin } from './singleton';

const DIVIDER_TITLE = '———';

interface FakeAction {
	readonly action: string;
}

interface FakeBuilder {
	getId: () => string | undefined;
	getItems: () => FakeBuilder[];
	getTitle: () => string | undefined;
	id: (value: string) => FakeBuilder;
	items: (value: FakeBuilder[]) => FakeBuilder;
	title: (value: string) => FakeBuilder;
}

interface FakeDocumentType {
	readonly name: string;
	readonly title: string;
}

interface FakeTemplateItem {
	readonly templateId: string;
}

type ActionsResolver = (previous: FakeAction[], context: { schemaType: string }) => FakeAction[];

type NewDocumentOptionsResolver = (
	previous: FakeTemplateItem[],
	context: { creationContext: { type: string } },
) => FakeTemplateItem[];

/**
 * Creates a builder that remembers its `id`, `title` and `items` and returns itself for every
 * other chained call (`.icon()`, `.child()`, `.schemaType()`, …).
 *
 * @returns The fake builder.
 */
function createFakeBuilder(): FakeBuilder {
	let id: string | undefined;
	let title: string | undefined;
	let items: FakeBuilder[] = [];
	const builder = new Proxy(
		{},
		{
			get(_target, property) {
				switch (property) {
					case 'getId': {
						return () => id;
					}
					case 'getItems': {
						return () => items;
					}
					case 'getTitle': {
						return () => title;
					}
					case 'id': {
						return (value: string) => {
							id = value;
							return builder;
						};
					}
					case 'items': {
						return (value: FakeBuilder[]) => {
							items = value;
							return builder;
						};
					}
					case 'title': {
						return (value: string) => {
							title = value;
							return builder;
						};
					}
					default: {
						return () => builder;
					}
				}
			},
		},
	) as FakeBuilder;
	return builder;
}

/**
 * `pageStructure` reads ids and titles back out of the list items to filter and sort them, so
 * unlike the call recorder in `structure/index.test.ts` this fake keeps that state.
 *
 * @param documentTypes - The document types `S.documentTypeListItems()` returns.
 * @returns The fake structure builder.
 */
function createFakeStructureBuilder(documentTypes: readonly FakeDocumentType[]): StructureBuilder {
	return new Proxy(
		{},
		{
			get(_target, property) {
				switch (property) {
					case 'divider': {
						return () => createFakeBuilder().title(DIVIDER_TITLE);
					}
					case 'documentTypeListItems': {
						return () =>
							documentTypes.map(({ name, title }) => createFakeBuilder().id(name).title(title));
					}
					default: {
						return () => createFakeBuilder();
					}
				}
			},
		},
	) as StructureBuilder;
}

describe('singleton plugin document actions', () => {
	it('strips the duplicate action for a listed type', () => {
		const plugin = singletonPlugin(['site-settings']);
		const actions = plugin.document?.actions as unknown as ActionsResolver;
		const previous: FakeAction[] = [
			{ action: 'publish' },
			{ action: 'duplicate' },
			{ action: 'unpublish' },
		];

		const result = actions(previous, { schemaType: 'site-settings' });

		expect(result).toStrictEqual([{ action: 'publish' }, { action: 'unpublish' }]);
	});

	it('leaves the actions untouched for an unlisted type', () => {
		const plugin = singletonPlugin(['site-settings']);
		const actions = plugin.document?.actions as unknown as ActionsResolver;
		const previous: FakeAction[] = [
			{ action: 'publish' },
			{ action: 'duplicate' },
			{ action: 'unpublish' },
		];

		const result = actions(previous, { schemaType: 'news.article' });

		expect(result).toBe(previous);
	});
});

describe('singleton plugin new document options', () => {
	it('filters listed template items when the creation context is global', () => {
		const plugin = singletonPlugin(['site-settings']);
		const newDocumentOptions = plugin.document
			?.newDocumentOptions as unknown as NewDocumentOptionsResolver;
		const previous: FakeTemplateItem[] = [
			{ templateId: 'site-settings' },
			{ templateId: 'news.article' },
		];

		const result = newDocumentOptions(previous, { creationContext: { type: 'global' } });

		expect(result).toStrictEqual([{ templateId: 'news.article' }]);
	});

	it('returns the template items unchanged for a non-global creation context', () => {
		const plugin = singletonPlugin(['site-settings']);
		const newDocumentOptions = plugin.document
			?.newDocumentOptions as unknown as NewDocumentOptionsResolver;
		const previous: FakeTemplateItem[] = [
			{ templateId: 'site-settings' },
			{ templateId: 'news.article' },
		];

		const result = newDocumentOptions(previous, {
			creationContext: { type: 'structure' },
		});

		expect(result).toBe(previous);
	});
});

describe('page structure', () => {
	it('sorts every entry between the two dividers by title', () => {
		const structureBuilder = createFakeStructureBuilder([
			{ name: 'testimonial', title: 'Zeugnis / Referenz' },
			{ name: 'venue', title: 'Sportstätte' },
			{ name: 'news.article', title: 'News-Artikel' },
			{ name: 'media.folder', title: 'Media Folder' },
			{ name: 'sponsors', title: 'Sponsoren' },
			{ name: 'home', title: 'Startseite' },
		]);
		const singletons = [{ name: 'home', title: 'Startseite' }] as DocumentDefinition[];

		const root = pageStructure(singletons)(
			structureBuilder,
			{} as StructureResolverContext,
		) as FakeBuilder;

		expect(root.getItems().map((item) => item.getTitle())).toStrictEqual([
			'News',
			'Einzelseiten',
			DIVIDER_TITLE,
			'Gruppen',
			'Personen',
			'Sponsoren',
			'Sportstätte',
			'TSG-Echo',
			'Zeugnis / Referenz',
			DIVIDER_TITLE,
			'KI-Anweisungen',
			'Generelle Einstellungen',
		]);
	});
});
