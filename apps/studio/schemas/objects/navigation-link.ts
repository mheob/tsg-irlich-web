import { RiLinkM } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';
import type { ValidationContext } from 'sanity';

import { INTERNAL_LINK_TARGETS } from './internal-link';

/** Longest label that still fits the desktop bar next to its neighbours. */
const MAX_TITLE_LENGTH = 20;

const EXTERNAL_LINK_TYPE = 'external';
const INTERNAL_LINK_TYPE = 'internal';

/** The only protocols a menu entry may open. */
const WEB_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Whether a navigation link points outside the website. An entry without `linkType` (written before
 * the `main-navigation-items` migration) is an internal link.
 *
 * @param parent - The object holding the `linkType` field.
 * @returns `true` only for `linkType: 'external'`.
 */
function isExternalLink(parent: unknown): boolean {
	return (
		typeof parent === 'object' &&
		parent !== null &&
		'linkType' in parent &&
		parent.linkType === EXTERNAL_LINK_TYPE
	);
}

/**
 * Requires a page for an internal link.
 *
 * @param value - The reference.
 * @param context - The validation context, whose `parent` is the navigation link.
 * @returns `true`, or the error shown to the editor.
 */
function validatePageReference(value: unknown, context: ValidationContext): true | string {
	return isExternalLink(context.parent) || value ? true : 'Bitte eine Seite auswählen';
}

/**
 * Requires a valid web URL for an external link, and ignores the hidden field of an internal one, so
 * a stale value left there after switching the link type cannot block publishing.
 *
 * @param value - The URL.
 * @param context - The validation context, whose `parent` is the navigation link.
 * @returns `true`, or the error shown to the editor.
 */
function validateExternalUrl(value: unknown, context: ValidationContext): true | string {
	if (!isExternalLink(context.parent)) {
		return true;
	}

	if (!value) {
		return 'Bitte eine URL angeben';
	}

	return typeof value === 'string' &&
		URL.canParse(value) &&
		WEB_PROTOCOLS.has(new URL(value).protocol)
		? true
		: 'Die URL ist ungültig.';
}

/**
 * Builds the list preview of a navigation link.
 *
 * @param selection - The selected fields, plus the number of children of a main navigation item.
 * @returns The title and a subtitle naming the target and, if there are any, the children.
 */
function prepareNavigationLink(selection: NavigationLinkSelection): NavigationLinkPreview {
	const { childCount = 0, href, linkType, title } = selection;
	const target = linkType === EXTERNAL_LINK_TYPE ? href : 'Interne Seite';

	if (childCount === 0) {
		return { subtitle: target, title };
	}

	const children = childCount === 1 ? '1 Unterpunkt' : `${childCount} Unterpunkte`;
	return { subtitle: target ? `${target} · ${children}` : children, title };
}

const navigationLinkFields = [
	defineField({
		name: 'title',
		title: 'Bezeichnung',
		type: 'string',
		validation: (Rule) => [
			Rule.required().error('Die Bezeichnung ist erforderlich'),
			Rule.max(MAX_TITLE_LENGTH).warning(
				`Die Bezeichnung sollte nicht länger als ${MAX_TITLE_LENGTH} Zeichen sein`,
			),
		],
	}),
	defineField({
		initialValue: INTERNAL_LINK_TYPE,
		name: 'linkType',
		options: {
			direction: 'horizontal',
			layout: 'radio',
			list: [
				{ title: 'Interne Seite', value: INTERNAL_LINK_TYPE },
				{ title: 'Externe URL', value: EXTERNAL_LINK_TYPE },
			],
		},
		title: 'Art des Links',
		type: 'string',
		validation: (Rule) => Rule.required().error('Die Art des Links ist erforderlich'),
	}),
	defineField({
		hidden: ({ parent }) => isExternalLink(parent),
		name: 'link',
		title: 'Seite',
		to: INTERNAL_LINK_TARGETS,
		type: 'reference',
		validation: (Rule) => Rule.custom(validatePageReference),
	}),
	defineField({
		hidden: ({ parent }) => !isExternalLink(parent),
		name: 'href',
		title: 'URL',
		type: 'url',
		validation: (Rule) => Rule.custom(validateExternalUrl),
	}),
];

const navigationLink = defineType({
	fields: navigationLinkFields,
	icon: RiLinkM,
	name: 'navigationLink',
	preview: {
		prepare: prepareNavigationLink,
		select: { href: 'href', linkType: 'linkType', title: 'title' },
	},
	title: 'Menüpunkt',
	type: 'object',
});

interface NavigationLinkSelection {
	childCount?: number;
	href?: string;
	linkType?: string;
	title?: string;
}

interface NavigationLinkPreview {
	subtitle?: string;
	title?: string;
}

export default navigationLink;
export {
	isExternalLink,
	navigationLinkFields,
	prepareNavigationLink,
	validateExternalUrl,
	validatePageReference,
	type NavigationLinkPreview,
	type NavigationLinkSelection,
};
