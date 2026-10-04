import { RiMenuLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import {
	MAX_DESCRIPTION_LENGTH,
	navigationLinkFields,
	prepareNavigationLink,
} from './navigation-link';
import type { NavigationLinkPreview, NavigationLinkSelection } from './navigation-link';

/** More children than this make the dropdown hard to scan. */
const MAX_CHILDREN = 8;

/**
 * Whether a main navigation item has children, which is when it opens a dropdown at all.
 *
 * @param parent - The main navigation item.
 * @returns `true` if `children` holds at least one entry.
 */
function hasChildren(parent: unknown): boolean {
	return (
		typeof parent === 'object' &&
		parent !== null &&
		'children' in parent &&
		Array.isArray(parent.children) &&
		parent.children.length > 0
	);
}

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
				'Unterpunkte erscheinen als Aufklappmenü. Die Seite des Hauptpunkts steht dort als erster Eintrag, sein Titel und seine Beschreibung lassen sich darunter einstellen.',
			fieldset: 'dropdown',
			name: 'children',
			of: [defineArrayMember({ type: 'navigationLink' })],
			title: 'Unterpunkte',
			type: 'array',
			validation: (Rule) =>
				Rule.max(MAX_CHILDREN).warning(
					`Mehr als ${MAX_CHILDREN} Unterpunkte machen das Aufklappmenü unübersichtlich`,
				),
		}),
		defineField({
			description:
				'Bezeichnung des ersten Eintrags im Aufklappmenü, der zur Seite des Hauptpunkts führt. Leer bleibt es bei „Übersicht“.',
			fieldset: 'dropdown',
			hidden: ({ parent }) => !hasChildren(parent),
			name: 'overviewTitle',
			placeholder: 'Übersicht',
			title: 'Titel',
			type: 'string',
		}),
		defineField({
			description: 'Erscheint auf dem Desktop unter dem Titel des ersten Eintrags.',
			fieldset: 'dropdown',
			hidden: ({ parent }) => !hasChildren(parent),
			name: 'overviewDescription',
			rows: 2,
			title: 'Beschreibung',
			type: 'text',
			validation: (Rule) =>
				Rule.max(MAX_DESCRIPTION_LENGTH).warning(
					`Die Beschreibung sollte nicht länger als ${MAX_DESCRIPTION_LENGTH} Zeichen sein, das Aufklappmenü zeigt höchstens zwei Zeilen`,
				),
		}),
		defineField({
			description: 'Stellt das Aufklappmenü auf dem Desktop in zwei Spalten dar.',
			fieldset: 'dropdown',
			hidden: ({ parent }) => !hasChildren(parent),
			initialValue: false,
			name: 'hasTwoColumns',
			title: 'Zweispaltig',
			type: 'boolean',
		}),
	],
	fieldsets: [{ name: 'dropdown', options: { collapsible: true }, title: 'Aufklappmenü' }],
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
