import { RiPagesLine } from 'react-icons/ri';
import type { DocumentDefinition } from 'sanity';
import type { ListBuilder, ListItemBuilder, StructureBuilder } from 'sanity/structure';

import { getGroup } from './index';
import { PAGE_LAYOUT, getPlacedPages } from './pages';
import type { PageSection, SinglePageType } from './pages';

/** Single documents with a place of their own outside the pages. */
const PLACED_ELSEWHERE: ReadonlySet<string> = new Set(['site-settings']);

type FindDefinition = (type: SinglePageType) => DocumentDefinition | undefined;

/** An entry of a list in the desk: a list item or a divider. */
type ListEntry = Parameters<ListBuilder['items']>[0][number];

/** The list items of an area of the website, before the dividers go in between. */
interface SectionItems {
	readonly content: readonly ListItemBuilder[];
	readonly mainPage: readonly ListItemBuilder[];
	readonly pages: readonly ListItemBuilder[];
}

/**
 * Returns the list item that opens a single page, the one document of its type.
 *
 * @param S - The structure builder.
 * @param definition - The schema of the page.
 * @returns The list item of the page.
 */
function getPageListItem(S: StructureBuilder, definition: DocumentDefinition): ListItemBuilder {
	return S.listItem()
		.title(definition.title ?? definition.name)
		.id(definition.name)
		.icon(definition.icon)
		.child(S.document().schemaType(definition.name).documentId(definition.name));
}

/**
 * Returns the list items of the given pages, skipping a page whose schema is missing.
 *
 * @param S - The structure builder.
 * @param types - The schema types of the pages.
 * @param findDefinition - Looks up the schema of a page.
 * @returns The list items of the pages found.
 */
function getPageListItemsOf(
	S: StructureBuilder,
	types: readonly SinglePageType[],
	findDefinition: FindDefinition,
): ListItemBuilder[] {
	return types.flatMap((type) => {
		const definition = findDefinition(type);
		return definition ? [getPageListItem(S, definition)] : [];
	});
}

/**
 * Puts the list items of an area in order: its main page first, then the pages below it after the
 * divider „Unterseiten“, then the documents they show after the divider „Inhalte“. Without a main
 * page the pages need no divider, since they stand side by side.
 *
 * @param S - The structure builder.
 * @param items - The list items of the area.
 * @returns The entries of the area's list.
 */
function getSectionEntries(S: StructureBuilder, items: SectionItems): ListEntry[] {
	const { content, mainPage, pages } = items;
	const pagesDivider = mainPage.length > 0 && pages.length > 0;
	return [
		...mainPage,
		...(pagesDivider ? [S.divider().title('Unterseiten')] : []),
		...pages,
		...(content.length > 0 ? [S.divider().title('Inhalte'), ...content] : []),
	];
}

/**
 * Returns the list item of an area of the website, which opens its pages and documents.
 *
 * @param S - The structure builder.
 * @param section - The area of the website.
 * @param findDefinition - Looks up the schema of a page.
 * @returns The list item, or `undefined` if the area has neither pages nor documents.
 */
function getSectionListItem(
	S: StructureBuilder,
	section: PageSection,
	findDefinition: FindDefinition,
): ListItemBuilder | undefined {
	const items: SectionItems = {
		content: section.content.flatMap((group) => getGroup(S, group)),
		mainPage: getPageListItemsOf(S, section.mainPage ? [section.mainPage] : [], findDefinition),
		pages: getPageListItemsOf(S, section.pages, findDefinition),
	};
	if (items.mainPage.length + items.pages.length + items.content.length === 0) {
		return undefined;
	}

	return S.listItem()
		.title(section.title)
		.id(section.id)
		.icon(section.icon)
		.child(S.list().title(section.title).items(getSectionEntries(S, items)));
}

/**
 * Returns the upper block of the desk: the single pages and the areas of the website, in the order
 * of `PAGE_LAYOUT`. A single page the layout does not place still shows up, under „Weitere Seiten“
 * at the end, so a new page cannot go missing from the desk.
 *
 * @param S - The structure builder.
 * @param definitions - The schemas of the single documents.
 * @returns The list items of the upper block.
 */
function getPageListItems(
	S: StructureBuilder,
	definitions: readonly DocumentDefinition[],
): ListItemBuilder[] {
	const definitionsByName = new Map(definitions.map((definition) => [definition.name, definition]));
	const findDefinition: FindDefinition = (type) => definitionsByName.get(type);

	const items = PAGE_LAYOUT.flatMap((entry) => {
		if (typeof entry === 'string') {
			return getPageListItemsOf(S, [entry], findDefinition);
		}
		const section = getSectionListItem(S, entry, findDefinition);
		return section ? [section] : [];
	});

	const placed = new Set<string>([...getPlacedPages(), ...PLACED_ELSEWHERE]);
	const unplaced = definitions.filter(({ name }) => !placed.has(name));
	if (unplaced.length === 0) {
		return items;
	}

	return [
		...items,
		S.listItem()
			.title('Weitere Seiten')
			.id('other-pages')
			.icon(RiPagesLine)
			.child(
				S.list()
					.title('Weitere Seiten')
					.items(unplaced.map((definition) => getPageListItem(S, definition))),
			),
	];
}

export { getPageListItems };
