import type { StructureBuilder } from 'sanity/structure';

/** The title an untitled divider carries in the fake, so a list of titles shows where it sits. */
const DIVIDER_TITLE = '———';

/**
 * A builder of the fake structure builder. Every chained call (`.title()`, `.child()`, `.icon()`,
 * …) stores its argument, and the matching getter (`getTitle()`, `getChild()`, …) reads it back.
 */
interface FakeBuilder {
	child: (value: unknown) => FakeBuilder;
	documentId: (value: string) => FakeBuilder;
	getChild: () => FakeBuilder | undefined;
	getDocumentId: () => string | undefined;
	getId: () => string | undefined;
	getItems: () => FakeBuilder[];
	getSchemaType: () => string | undefined;
	getTitle: () => string | undefined;
	id: (value: string) => FakeBuilder;
	items: (value: readonly unknown[]) => FakeBuilder;
	/** The method of the structure builder that created this builder, e.g. `listItem`. */
	readonly kind: string;
	schemaType: (value: string) => FakeBuilder;
	title: (value: string) => FakeBuilder;
}

interface FakeDocumentType {
	readonly name: string;
	readonly title: string;
}

/**
 * Creates a builder that remembers the last argument of every chained call.
 *
 * @param kind - The method of the structure builder that created it.
 * @returns The fake builder.
 */
function createFakeBuilder(kind: string): FakeBuilder {
	const values = new Map<string, unknown>();
	const builder: FakeBuilder = new Proxy({} as FakeBuilder, {
		get(_target, property) {
			const name = String(property);
			if (name === 'kind') {
				return kind;
			}
			if (name.startsWith('get')) {
				const key = `${name.charAt(3).toLowerCase()}${name.slice(4)}`;
				return () => values.get(key) ?? (key === 'items' ? [] : undefined);
			}
			return (value: unknown) => {
				values.set(name, value);
				return builder;
			};
		},
	});
	return builder;
}

/**
 * Creates a structure builder for tests. Unlike a call recorder, its builders keep their state, so
 * a test can read ids, titles, items and children back, the way the studio renders them.
 * `documentTypeListItem(name)` and `documentTypeListItems()` stand in for the schema: the first
 * titles its item with the type name, the second lists the given document types.
 *
 * @param documentTypes - The document types `S.documentTypeListItems()` returns.
 * @returns The fake structure builder.
 */
function createFakeStructureBuilder(
	documentTypes: readonly FakeDocumentType[] = [],
): StructureBuilder {
	return new Proxy({} as StructureBuilder, {
		get(_target, property) {
			const kind = String(property);
			switch (kind) {
				case 'divider': {
					return () => createFakeBuilder(kind).title(DIVIDER_TITLE);
				}
				case 'documentTypeListItem': {
					return (name: string) => createFakeBuilder(kind).id(name).title(name);
				}
				case 'documentTypeListItems': {
					return () =>
						documentTypes.map(({ name, title }) => createFakeBuilder(kind).id(name).title(title));
				}
				default: {
					return () => createFakeBuilder(kind);
				}
			}
		},
	});
}

/**
 * Reads the titles of the items of a list, dividers included.
 *
 * @param list - A list builder of the fake.
 * @returns The titles in the order of the list.
 */
function getItemTitles(list: FakeBuilder | undefined): (string | undefined)[] {
	return (list?.getItems() ?? []).map((item) => item.getTitle());
}

export { DIVIDER_TITLE, createFakeStructureBuilder, getItemTitles };
export type { FakeBuilder, FakeDocumentType };
