// oxlint-disable no-magic-numbers

import { RiTeamLine } from 'react-icons/ri';
import type { Reference, SlugValidationContext } from 'sanity';
import { defineField, defineType } from 'sanity';

import { emailField } from '@/shared/fields/contact';
import { dosbIconField } from '@/shared/fields/dosb-icon';
import { slugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { previousPathsField } from '@/shared/fields/slug-history';
import { getFieldWithoutGroup } from '@/utils/fields';

const GROUP_API_VERSION = '2026-10-01';

/** The prefix of a draft (`drafts.<id>`) or of the version of a release (`versions.<release>.<id>`). */
const NON_PUBLISHED_ID_PREFIX = /^(?:drafts\.|versions\.[^.]+\.)/u;

/**
 * Whether a group is the referees' group, which has no training times.
 *
 * @param title - The title of the group document.
 * @returns `true` for "Schiedsrichter", in any letter case.
 */
function isRefereeGroup(title: unknown): boolean {
	return typeof title === 'string' && title.toLowerCase() === 'schiedsrichter';
}

/**
 * Checks that no other group of the same department uses a slug. Group slugs only have to be unique
 * per department, so two departments may each have a group "herren".
 *
 * The query runs in the raw perspective, so it sees drafts and release versions as documents of their
 * own, and `sanity::versionOf` leaves out those of this very group. A draft of another group with the
 * same slug still counts.
 *
 * @param slug - The slug to check.
 * @param context - The slug validation context, whose `document` is the group.
 * @returns `false` when another group of the department already uses the slug.
 */
async function isGroupSlugUniqueInDepartment(
	slug: string,
	context: SlugValidationContext,
): Promise<boolean> {
	const { document, getClient } = context;
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	const departmentId = (document?.department as Reference | undefined)?._ref;
	if (!document || !departmentId) {
		// The required department already shows an error, so the slug has nothing to be checked against.
		return true;
	}

	return getClient({ apiVersion: GROUP_API_VERSION })
		.withConfig({ perspective: 'raw' })
		.fetch<boolean>(
			'count(*[_type == "group" && slug.current == $slug && department._ref == $departmentId && !sanity::versionOf($publishedId)]) == 0',
			{ departmentId, publishedId: document._id.replace(NON_PUBLISHED_ID_PREFIX, ''), slug },
		);
}

const group = defineType({
	fields: [
		defineField({
			description: 'Unter welcher Abteilung die Gruppe auf der Website erscheint.',
			name: 'department',
			title: 'Abteilung',
			to: [{ type: 'department' }],
			type: 'reference',
			validation: (Rule) => Rule.required().error('Die Abteilung ist erforderlich'),
		}),

		defineField({
			name: 'title',
			title: 'Name',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(2).error('Name muss mindestens 2 Zeichen lang sein'),
				Rule.max(64).warning('Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		{
			...getFieldWithoutGroup(slugField),
			options: { ...slugField.options, isUnique: isGroupSlugUniqueInDepartment },
		},

		previousPathsField,

		getFieldWithoutGroup(emailField),

		getFieldWithoutGroup(metaField),

		defineField({
			description: 'Optional, Fallback: Name. Wird für die Gruppen-Übersicht verwendet.',
			name: 'overviewTitle',
			title: 'Übersichtstitel',
			type: 'string',
			validation: (Rule) => [
				Rule.min(2).warning('Übersichtstitel muss mindestens 2 Zeichen lang sein'),
				Rule.max(64).warning('Übersichtstitel sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		defineField({
			description: 'Die Sortierreihenfolge wird für die Gruppen-Übersicht verwendet.',
			name: 'sortOrder',
			title: 'Sortierreihenfolge',
			type: 'number',
			validation: (Rule) => Rule.required().error('Sortierreihenfolge ist erforderlich'),
		}),

		defineField({
			description: 'Eine Beschreibung der Gruppe / Mannschaft.',
			name: 'description',
			title: 'Beschreibung',
			type: 'simpleBlockContent',
			validation: (Rule) => [Rule.required().error('Beschreibung ist erforderlich')],
		}),

		dosbIconField,

		// Keeps the name of the former background image, so the existing images stay without a migration.
		defineField({
			description:
				'Das Kachelbild erscheint auf den Gruppenkacheln der Abteilungsseite. Fehlen Hero- oder Open-Graph-Bild, dient es als Rückfall.',
			name: 'featuredImage',
			title: 'Kachelbild',
			type: 'extendedImage',
			validation: (Rule) => Rule.required().assetRequired().error('Kachelbild ist erforderlich'),
		}),

		defineField({
			description: 'Optional. Ohne Hero-Bild zeigt die Gruppenseite das Kachelbild.',
			name: 'heroImage',
			title: 'Hero-Bild',
			type: 'extendedImage',
		}),

		defineField({
			description: 'Es können bis zu drei Bilder ausgewählt werden.',
			name: 'images',
			of: [{ type: 'extendedImage' }],
			title: 'Bildergalerie',
			type: 'array',
			validation: (Rule) => [Rule.max(3).error('Es dürfen maximal drei Bilder ausgewählt werden.')],
		}),

		defineField({
			description: 'Beschreibung zu den Trainingszeiten und -orten.',
			fields: [
				defineField({
					name: 'trainingDescription',
					title: 'Beschreibung zu den Trainingszeiten und -orten',
					type: 'simpleBlockContent',
				}),
				defineField({
					name: 'trainingTimes',
					of: [{ type: 'trainingTime' }],
					title: 'Trainingszeiten und -orte',
					type: 'array',
				}),
			],
			hidden: ({ document }) => isRefereeGroup(document?.title),
			name: 'training',
			title: 'Trainingszeiten und -orte',
			type: 'object',
			validation: (Rule) => [
				Rule.custom((value, context) =>
					isRefereeGroup(context.document?.title) || value
						? true
						: 'Trainingszeiten und -orte sind erforderlich',
				),
			],
		}),

		defineField({
			description:
				'Aus dieser Kategorie werden die drei neuesten News-Artikel auf der Gruppenseite angezeigt. Leer lassen, wenn keine Kategorie passt.',
			name: 'newsCategory',
			title: 'News-Kategorie',
			to: [{ type: 'news.category' }],
			type: 'reference',
		}),
	],
	icon: RiTeamLine,
	name: 'group',
	orderings: [
		{
			by: [{ direction: 'asc', field: 'title' }],
			name: 'titleAsc',
			title: 'nach Name - aufsteigend',
		},
		{
			by: [{ direction: 'desc', field: 'title' }],
			name: 'titleDesc',
			title: 'nach Name - absteigend',
		},
		{
			by: [{ direction: 'asc', field: 'sortOrder' }],
			name: 'sortOrderAsc',
			title: 'nach Sortierreihenfolge - aufsteigend',
		},
		{
			by: [{ direction: 'desc', field: 'sortOrder' }],
			name: 'sortOrderDesc',
			title: 'nach Sortierreihenfolge - absteigend',
		},
	],
	preview: {
		prepare: ({
			departmentTitle,
			sortOrder,
			title,
		}: {
			departmentTitle?: string;
			sortOrder?: number;
			title?: string;
		}) => ({
			// "Herren" exists in more than one department, so a picker needs the department to tell them apart.
			subtitle: [departmentTitle, `Sortierreihenfolge: ${sortOrder}`].filter(Boolean).join(' · '),
			title,
		}),
		select: {
			departmentTitle: 'department.title',
			sortOrder: 'sortOrder',
			title: 'title',
		},
	},
	title: 'Gruppe',
	type: 'document',
	validation: (Rule) => [Rule.required().error('Gruppe ist erforderlich')],
});

export { isGroupSlugUniqueInDepartment };
export default group;
