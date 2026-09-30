import { RiMenuLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { navigationLinkFields, prepareNavigationLink } from './navigation-link';
import type { NavigationLinkPreview, NavigationLinkSelection } from './navigation-link';

/** More children than this make the dropdown hard to scan. */
const MAX_CHILDREN = 8;

/**
 * Builds the list preview of a main navigation item, counting its children.
 *
 * @param selection - The selected fields, including the `children` array.
 * @returns The preview of `prepareNavigationLink`.
 */
function prepareMainNavigationItem(selection: MainNavigationItemSelection): NavigationLinkPreview {
	const { children, ...linkSelection } = selection;

	return prepareNavigationLink({
		...linkSelection,
		childCount: Array.isArray(children) ? children.length : 0,
	});
}

const mainNavigationItem = defineType({
	fields: [
		...navigationLinkFields,
		defineField({
			description:
				'Unterpunkte erscheinen als Aufklappmenü. Die Seite des Hauptpunkts wird dort automatisch als „Übersicht“ verlinkt.',
			name: 'children',
			of: [defineArrayMember({ type: 'navigationLink' })],
			title: 'Unterpunkte',
			type: 'array',
			validation: (Rule) =>
				Rule.max(MAX_CHILDREN).warning(
					`Mehr als ${MAX_CHILDREN} Unterpunkte machen das Aufklappmenü unübersichtlich`,
				),
		}),
	],
	icon: RiMenuLine,
	name: 'mainNavigationItem',
	preview: {
		prepare: prepareMainNavigationItem,
		select: { children: 'children', href: 'href', linkType: 'linkType', title: 'title' },
	},
	title: 'Hauptmenüpunkt',
	type: 'object',
});

interface MainNavigationItemSelection extends Omit<NavigationLinkSelection, 'childCount'> {
	children?: unknown;
}

export default mainNavigationItem;
export { prepareMainNavigationItem };
