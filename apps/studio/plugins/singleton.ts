import { definePlugin } from 'sanity';
import type { DocumentDefinition } from 'sanity';
import type { StructureResolver } from 'sanity/structure';

import { SinglePageInput } from '@/components/single-page-input';
import { getGroup, isExcludedDefaultListItem } from '@/structure';
import { getPageListItems } from '@/structure/sections';

/**
 * This plugin contains all the logic for setting up the singletons
 */
const singletonPlugin = definePlugin((types: string[]) => ({
	document: {
		// Hide 'Singletons (such as Settings)' from new document options
		// Removes the "duplicate" action on the Singletons (such as Home)
		actions: (previous, { schemaType }) => {
			if (types.includes(schemaType)) {
				return previous.filter(({ action }) => action !== 'duplicate');
			}
			return previous;
		},
		// https://user-images.githubusercontent.com/81981/195728798-e0c6cf7e-d442-4e58-af3a-8cd99d7fcc28.png
		newDocumentOptions: (previous, { creationContext }) => {
			if (creationContext.type === 'global') {
				return previous.filter((templateItem) => !types.includes(templateItem.templateId));
			}
			return previous;
		},
	},
	// Shows above the form of a single page where it sits on the website
	form: { components: { input: SinglePageInput } },
	name: 'singletonPlugin',
}));

/**
 * The StructureResolver is how we're changing the DeskTool structure to linking to document
 * (named Singleton) like how "Home" is handled.
 *
 * @param typeDefinitionArray The array of document definitions that are singletons
 * @returns The StructureResolver
 */
function pageStructure(typeDefinitionArray: DocumentDefinition[]): StructureResolver {
	return (S) => {
		// The middle block: the documents several areas of the website share, plus the default root
		// list items (except custom ones), all sorted by title. The FAQ also sits under „Angebot“.
		const middleListItems = [
			...getGroup(S, 'faq'),
			...getGroup(S, 'forms'),
			...getGroup(S, 'persons'),
			...S.documentTypeListItems().filter(
				(listItem) =>
					!typeDefinitionArray.some((singleton) => singleton.name === listItem.getId()) &&
					isExcludedDefaultListItem(listItem.getId()),
			),
		].toSorted((a, b) => a.getTitle()?.localeCompare(b.getTitle() ?? '') ?? 0);

		return S.list()
			.title('Base')
			.items([
				...getPageListItems(S, typeDefinitionArray),
				S.divider(),
				...middleListItems,
				S.divider(),
				...getGroup(S, 'settings'),
			]);
	};
}

export { singletonPlugin, pageStructure };
