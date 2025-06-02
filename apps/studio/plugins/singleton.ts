import { definePlugin, type DocumentDefinition } from 'sanity';
import type { StructureResolver } from 'sanity/structure';

import { getGroup, isExcludedDefaultListItem } from '@/structure';

/**
 * This plugin contains all the logic for setting up the singletons
 */
export const singletonPlugin = definePlugin((types: string[]) => {
	return {
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
					return previous.filter(templateItem => !types.includes(templateItem.templateId));
				}
				return previous;
			},
		},
		name: 'singletonPlugin',
	};
});

/**
 * The StructureResolver is how we're changing the DeskTool structure to linking to document
 * (named Singleton) like how "Home" is handled.
 *
 * @param typeDefinitionArray The array of document definitions that are singletons
 * @returns The StructureResolver
 */
export function pageStructure(typeDefinitionArray: DocumentDefinition[]): StructureResolver {
	return S => {
		// The default root list items (except custom ones)
		const defaultListItems = S.documentTypeListItems().filter(
			listItem =>
				!typeDefinitionArray.some(singleton => singleton.name === listItem.getId()) &&
				isExcludedDefaultListItem(listItem.getId()),
		);

		return S.list()
			.title('Base')
			.items([
				...getGroup(S, 'news'),
				...getGroup(S, 'single-pages', typeDefinitionArray),
				S.divider(),
				...getGroup(S, 'persons'),
				...getGroup(S, 'groups'),
				...defaultListItems,
				S.divider(),
				...getGroup(S, 'settings'),
			]);
	};
}
