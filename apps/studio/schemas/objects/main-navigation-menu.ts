import { RiMenuLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { navigationTitleField } from './navigation-link';
import type { NavigationLinkPreview } from './navigation-link';

/** More children than this make the dropdown hard to scan. */
const MAX_CHILDREN = 8;

/**
 * Requires at least one child. The studio calls the rule with `undefined` for a field never
 * touched, so a missing array counts as empty.
 *
 * @param value - The children.
 * @returns `true`, or the error shown to the editor.
 */
function validateMenuChildren(value: unknown): true | string {
	return Array.isArray(value) && value.length > 0
		? true
		: 'Ein Menü braucht mindestens einen Unterpunkt';
}

/**
 * Builds the list preview of a menu, counting its children.
 *
 * @param selection - The title and the `children` array.
 * @returns The title and a subtitle like `Menü · 2 Unterpunkte`.
 */
function prepareMainNavigationMenu(selection: MainNavigationMenuSelection): NavigationLinkPreview {
	const count = Array.isArray(selection.children) ? selection.children.length : 0;
	const children = count === 1 ? '1 Unterpunkt' : `${count} Unterpunkte`;
	return { subtitle: `Menü · ${children}`, title: selection.title };
}

/** A first-level entry that only opens a dropdown; the pages are its children. */
const mainNavigationMenu = defineType({
	fields: [
		navigationTitleField,
		defineField({
			description:
				'Die Einträge des Aufklappmenüs. Ein Menü führt selbst nirgendwohin, die Seite gehört als Unterpunkt hinein.',
			name: 'children',
			of: [defineArrayMember({ type: 'navigationLink' })],
			title: 'Unterpunkte',
			type: 'array',
			validation: (Rule) => [
				Rule.custom(validateMenuChildren),
				Rule.max(MAX_CHILDREN).warning(
					`Mehr als ${MAX_CHILDREN} Unterpunkte machen das Aufklappmenü unübersichtlich`,
				),
			],
		}),
		defineField({
			description: 'Stellt das Aufklappmenü auf dem Desktop in zwei Spalten dar.',
			initialValue: false,
			name: 'hasTwoColumns',
			title: 'Zweispaltig',
			type: 'boolean',
		}),
	],
	icon: RiMenuLine,
	name: 'mainNavigationMenu',
	preview: {
		prepare: prepareMainNavigationMenu,
		select: { children: 'children', title: 'title' },
	},
	title: 'Menü',
	type: 'object',
});

interface MainNavigationMenuSelection {
	children?: unknown;
	title?: string;
}

export default mainNavigationMenu;
export { prepareMainNavigationMenu, validateMenuChildren };
