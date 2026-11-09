// oxlint-disable no-magic-numbers

import { RiTrophyLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { content, general, images, meta } from '@/shared/field-groups';
import { dosbIconField } from '@/shared/fields/dosb-icon';
import { introField, slugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { searchTermsField } from '@/shared/fields/search-terms';
import { previousSlugsField } from '@/shared/fields/slug-history';
import { getFieldWithGroup } from '@/utils/fields';

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

/**
 * Warns when a department has no intro of its own. The page then shows the intro all departments
 * share, so six pages read alike (WEB-417).
 *
 * @param intro - The intro of the department.
 * @returns `true`, or the message for an editor.
 */
function validateDepartmentIntro(intro?: string): string | true {
	return intro?.trim()
		? true
		: 'Ohne eigenes Intro zeigt die Abteilungsseite den gemeinsamen Text aller Abteilungen.';
}

/**
 * Warns when a department has no meta description of its own. The website then describes the page by
 * its intro, and without one by the description all departments share (WEB-417).
 *
 * @param metaValue - The meta object of the department.
 * @returns `true`, or the message for an editor.
 */
function validateDepartmentMetaDescription(metaValue?: MetaFieldsValue): string | true {
	return metaValue?.metaDescription?.trim()
		? true
		: 'Ohne eigene Meta-Beschreibung steht in Suchergebnissen das Intro oder, ohne Intro, der gemeinsame Text aller Abteilungen.';
}

const department = defineType({
	fields: [
		defineField({
			group: 'general',
			name: 'title',
			title: 'Name',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(2).error('Name muss mindestens 2 Zeichen lang sein'),
				Rule.max(64).warning('Name sollte nicht länger als 64 Zeichen sein'),
			],
		}),

		getFieldWithGroup(searchTermsField, 'general'),

		getFieldWithGroup(slugField, 'general'),

		getFieldWithGroup(previousSlugsField, 'general'),

		getFieldWithGroup(dosbIconField, 'general'),

		defineField({
			description:
				'Die Sortierreihenfolge bestimmt die Reihenfolge auf der Startseite und unter /angebot.',
			group: 'general',
			name: 'sortOrder',
			title: 'Sortierreihenfolge',
			type: 'number',
			validation: (Rule) => Rule.required().error('Sortierreihenfolge ist erforderlich'),
		}),

		defineField({
			description: 'Gruppen dieser Abteilung sind Mannschaften (im JSON-LD `SportsTeam`).',
			group: 'general',
			initialValue: false,
			name: 'isTeamSport',
			title: 'Mannschaftssport',
			type: 'boolean',
		}),

		defineField({
			description:
				'Das Kachelbild erscheint auf den Kacheln unter /angebot. Fehlen Hero- oder Open-Graph-Bild, dient es als Rückfall.',
			group: 'images',
			name: 'cardImage',
			title: 'Kachelbild',
			type: 'extendedImage',
			validation: (Rule) => Rule.required().assetRequired().error('Kachelbild ist erforderlich'),
		}),

		defineField({
			description: 'Optional. Ohne Hero-Bild zeigt die Seite das Kachelbild.',
			group: 'images',
			name: 'heroImage',
			title: 'Hero-Bild',
			type: 'extendedImage',
		}),

		{
			...getFieldWithGroup(introField, 'content'),
			description:
				'Ersetzt auf der Abteilungsseite das gemeinsame Intro des Abschnitts „Gruppen“. Ohne eigene Meta-Beschreibung steht es auch in Suchergebnissen.',
			validation: (Rule) => Rule.custom(validateDepartmentIntro).warning(),
		},

		{
			...getFieldWithGroup(metaField, 'meta'),
			description:
				'Ohne eigene Meta-Beschreibung nimmt die Abteilungsseite das Intro, ohne Intro den gemeinsamen Text aller Abteilungen.',
			validation: (Rule) => Rule.custom(validateDepartmentMetaDescription).warning(),
		},

		defineField({
			description:
				'Optional. Ohne Statistiken zeigt die Abteilungsseite keinen Statistik-Abschnitt.',
			group: 'content',
			name: 'stats',
			of: [{ type: 'stats' }],
			title: 'Statistiken',
			type: 'array',
			validation: (Rule) => [Rule.max(4).error('Maximal 4 Statistiken dürfen gesetzt werden')],
		}),

		// Strong references, like the contact persons: a question a department still shows cannot be
		// deleted, and a new question is published before the department that shows it.
		defineField({
			description:
				'Optional. Die Reihenfolge hier ist die Reihenfolge auf der Abteilungsseite. Eine Frage kann in mehreren Abteilungen stehen und wird nur einmal gepflegt. Eine neue Frage zuerst veröffentlichen, dann die Abteilung.',
			group: 'content',
			name: 'faqs',
			of: [defineArrayMember({ to: [{ type: 'faq' }], type: 'reference' })],
			title: 'FAQ',
			type: 'array',
			validation: (Rule) => [Rule.unique().error('Eine Frage darf nur einmal ausgewählt werden')],
		}),

		defineField({
			description: 'Optional. Die Reihenfolge hier ist die Reihenfolge auf der Abteilungsseite.',
			group: 'content',
			name: 'contactPersons',
			of: [defineArrayMember({ to: [{ type: 'person' }], type: 'reference' })],
			title: 'Ansprechpartner',
			type: 'array',
			validation: (Rule) => [Rule.unique().error('Eine Person darf nur einmal ausgewählt werden')],
		}),
	],
	groups: [general, content, images, meta],
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

/** The value of a `metaFields` object (`schemas/objects/meta.tsx`). */
interface MetaFieldsValue {
	metaDescription?: string;
	metaTitle?: string;
	openGraphImage?: unknown;
}

export { prepareDepartmentPreview, validateDepartmentIntro, validateDepartmentMetaDescription };
export default department;
