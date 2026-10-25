// oxlint-disable no-magic-numbers

import { RiTrophyLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { dosbIconField } from '@/shared/fields/dosb-icon';
import { introField, slugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { previousSlugsField } from '@/shared/fields/slug-history';
import { getFieldWithoutGroup } from '@/utils/fields';

/**
 * Builds the list preview of a department: its name, its position in the sort order and its card image.
 *
 * @param selection - The values selected by the preview.
 * @param selection.media - The card image of the department.
 * @param selection.sortOrder - The position of the department on the website.
 * @param selection.title - The name of the department.
 * @returns The preview value shown in document lists.
 */
function prepareDepartmentPreview({
	media,
	sortOrder,
	title,
}: {
	media?: PreviewValue['media'];
	sortOrder?: number;
	title?: string;
}): { media?: PreviewValue['media']; subtitle: string; title?: string } {
	return { media, subtitle: `Sortierreihenfolge: ${sortOrder ?? '–'}`, title };
}

const department = defineType({
	fields: [
		defineField({
			name: 'title',
			title: 'Name',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(2).error('Name muss mindestens 2 Zeichen lang sein'),
				Rule.max(64).warning('Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		getFieldWithoutGroup(slugField),

		previousSlugsField,

		dosbIconField,

		defineField({
			description:
				'Die Sortierreihenfolge bestimmt die Reihenfolge auf der Startseite und unter /angebot.',
			name: 'sortOrder',
			title: 'Sortierreihenfolge',
			type: 'number',
			validation: (Rule) => Rule.required().error('Sortierreihenfolge ist erforderlich'),
		}),

		defineField({
			description: 'Gruppen dieser Abteilung sind Mannschaften (im JSON-LD `SportsTeam`).',
			initialValue: false,
			name: 'isTeamSport',
			title: 'Mannschaftssport',
			type: 'boolean',
		}),

		defineField({
			description:
				'Das Kachelbild erscheint auf den Kacheln unter /angebot. Fehlen Hero- oder Open-Graph-Bild, dient es als Rückfall.',
			name: 'cardImage',
			title: 'Kachelbild',
			type: 'extendedImage',
			validation: (Rule) => Rule.required().assetRequired().error('Kachelbild ist erforderlich'),
		}),

		defineField({
			description: 'Optional. Ohne Hero-Bild zeigt die Seite das Kachelbild.',
			name: 'heroImage',
			title: 'Hero-Bild',
			type: 'extendedImage',
		}),

		{
			...getFieldWithoutGroup(introField),
			description:
				'Optional. Ersetzt auf der Abteilungsseite das gemeinsame Intro des Abschnitts „Gruppen“.',
		},

		getFieldWithoutGroup(metaField),

		defineField({
			description: 'Optional. Ohne Statistiken zeigt die Abteilungsseite keinen Stats-Abschnitt.',
			name: 'stats',
			of: [{ type: 'stats' }],
			title: 'Stats',
			type: 'array',
			validation: (Rule) => [Rule.max(4).error('Maximal 4 Statistiken dürfen gesetzt werden')],
		}),

		defineField({
			description: 'Optional. Die Reihenfolge hier ist die Reihenfolge auf der Abteilungsseite.',
			name: 'contactPersons',
			of: [defineArrayMember({ to: [{ type: 'person' }], type: 'reference' })],
			title: 'Ansprechpartner',
			type: 'array',
			validation: (Rule) => [Rule.unique().error('Eine Person darf nur einmal ausgewählt werden')],
		}),
	],
	icon: RiTrophyLine,
	name: 'department',
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
		prepare: prepareDepartmentPreview,
		select: {
			media: 'cardImage.asset',
			sortOrder: 'sortOrder',
			title: 'title',
		},
	},
	title: 'Abteilung',
	type: 'document',
});

export { prepareDepartmentPreview };
export default department;
