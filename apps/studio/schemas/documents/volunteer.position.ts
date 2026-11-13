// oxlint-disable no-magic-numbers

import { RiUserHeartLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Builds the list preview of an open position: its title above its area.
 *
 * @param selection - The values selected by the preview.
 * @param selection.area - The area the position belongs to.
 * @param selection.title - The title of the position.
 * @returns The preview value shown in document lists.
 */
function prepareVolunteerPositionPreview({ area, title }: { area?: string; title?: string }): {
	subtitle?: string;
	title?: string;
} {
	return { subtitle: area, title };
}

/**
 * A list of short texts inside an open position, such as its tasks. An empty list is left out on
 * the website.
 *
 * @param name - The field name.
 * @param title - The German title, which the website also uses as default heading.
 * @param description - What belongs into the list.
 * @returns The field definition.
 */
function getListField(
	name: string,
	title: string,
	description: string,
): ReturnType<typeof defineField> {
	return defineField({
		description,
		name,
		of: [defineArrayMember({ type: 'string' })],
		title,
		type: 'array',
	});
}

/**
 * An open position of the volunteer page (`/verein/ehrenamt`, WEB-190). Every published position
 * appears on the page, the newest first; withdrawing one means taking back its publication, which
 * keeps the document for later.
 */
const volunteerPosition = defineType({
	fields: [
		defineField({
			description: 'Zum Beispiel „Schiedsrichter/in“ oder „Co-Trainer/in F-Jugend“.',
			name: 'title',
			title: 'Titel',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error('Der Titel ist erforderlich'),
				Rule.max(65).warning('Der Titel sollte nicht länger als 65 Zeichen sein'),
			],
		}),
		defineField({
			description:
				'Steht als Etikett neben dem Titel, zum Beispiel „Fußball“ oder „Vereinsorganisation“.',
			name: 'area',
			title: 'Bereich',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error('Der Bereich ist erforderlich'),
				Rule.max(32).warning('Der Bereich sollte nicht länger als 32 Zeichen sein'),
			],
		}),
		defineField({
			description: 'Steht mit einer Uhr neben dem Titel, zum Beispiel „wöchentlich, ca. 2 Std.“.',
			name: 'effort',
			title: 'Zeitaufwand',
			type: 'string',
			validation: (Rule) => [
				Rule.max(32).warning('Der Zeitaufwand sollte nicht länger als 32 Zeichen sein'),
			],
		}),
		defineField({
			description:
				'Ein, zwei Sätze, die die Aufgabe beschreiben. Sie stehen oben in der aufgeklappten Aufgabe.',
			name: 'teaser',
			rows: 3,
			title: 'Anreißer',
			type: 'text',
			validation: (Rule) => [
				Rule.required().error('Der Anreißer ist erforderlich'),
				Rule.max(240).warning('Der Anreißer sollte nicht länger als 240 Zeichen sein'),
			],
		}),
		getListField('tasks', 'Deine Aufgaben', 'Was die Person übernimmt, ein Punkt je Eintrag.'),
		getListField(
			'profile',
			'Das bringst du mit',
			'Was die Person mitbringen sollte, ein Punkt je Eintrag.',
		),
		getListField('offer', 'Das bieten wir', 'Was der Verein bietet, ein Punkt je Eintrag.'),
	],
	icon: RiUserHeartLine,
	name: 'volunteer.position',
	orderings: [
		{
			by: [{ direction: 'desc', field: '_createdAt' }],
			name: 'createdDesc',
			title: 'Neueste zuerst',
		},
		{
			by: [{ direction: 'asc', field: 'title' }],
			name: 'titleAsc',
			title: 'nach Titel',
		},
	],
	preview: {
		prepare: prepareVolunteerPositionPreview,
		select: { area: 'area', title: 'title' },
	},
	title: 'Offene Aufgabe',
	type: 'document',
});

export { prepareVolunteerPositionPreview };
export default volunteerPosition;
