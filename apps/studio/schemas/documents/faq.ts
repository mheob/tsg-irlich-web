// oxlint-disable no-magic-numbers

import { RiQuestionAnswerLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import externalLink from '../objects/external-link';
import internalLink from '../objects/internal-link';

/** How many department titles the preview names before it only counts the rest. */
const PREVIEW_DEPARTMENTS = 3;

/**
 * Builds the list preview of a FAQ: the question and the departments it appears on. Only the first
 * three titles are selected, so the rest is counted, as in "Fußball, Kurse, Tanzen +3".
 *
 * @param selection - The values selected by the preview.
 * @param selection.department0 - The title of the first department.
 * @param selection.department1 - The title of the second department.
 * @param selection.department2 - The title of the third department.
 * @param selection.departments - The references to the departments, read for their number.
 * @param selection.title - The question.
 * @returns The preview value shown in document lists.
 */
function prepareFaqPreview({
	department0,
	department1,
	department2,
	departments,
	title,
}: {
	department0?: string;
	department1?: string;
	department2?: string;
	departments?: readonly unknown[];
	title?: string;
}): { subtitle: string; title?: string } {
	const titles = [department0, department1, department2].filter(Boolean).join(', ');
	const more = (departments?.length ?? 0) - PREVIEW_DEPARTMENTS;

	return { subtitle: more > 0 ? `${titles} +${more}` : titles, title };
}

const faq = defineType({
	fields: [
		defineField({
			name: 'question',
			title: 'Frage',
			type: 'string',
			validation: (Rule) => [
				Rule.required().error('Frage ist erforderlich'),
				Rule.max(120).warning('Die Frage sollte nicht länger als 120 Zeichen sein'),
			],
		}),

		defineField({
			name: 'answer',
			of: [
				defineArrayMember({
					// No headings and no quote: the answer sits in an accordion right below its question.
					lists: [
						{ title: 'Aufzählung', value: 'bullet' },
						{ title: 'Nummeriert', value: 'number' },
					],
					marks: {
						annotations: [internalLink, externalLink],
						decorators: [
							{ title: 'Strong', value: 'strong' },
							{ title: 'Italic', value: 'em' },
						],
					},
					styles: [{ title: 'Normal', value: 'normal' }],
					type: 'block',
				}),
			],
			title: 'Antwort',
			type: 'array',
			validation: (Rule) => Rule.required().error('Antwort ist erforderlich'),
		}),

		defineField({
			description:
				'Auf welchen Abteilungsseiten die Frage erscheint. Für Suchmaschinen ausgezeichnet wird sie nur auf der Seite der ersten Abteilung.',
			name: 'departments',
			of: [
				defineArrayMember({
					options: { disableNew: true },
					to: [{ type: 'department' }],
					type: 'reference',
				}),
			],
			title: 'Abteilungen',
			type: 'array',
			validation: (Rule) => [
				Rule.required().min(1).error('Mindestens eine Abteilung ist erforderlich'),
				Rule.unique().error('Jede Abteilung nur einmal auswählen'),
			],
		}),

		defineField({
			description: 'Kleinere Zahlen stehen weiter oben, auf allen Seiten der Frage.',
			name: 'sortOrder',
			title: 'Sortierreihenfolge',
			type: 'number',
			validation: (Rule) => Rule.required().error('Sortierreihenfolge ist erforderlich'),
		}),
	],
	icon: RiQuestionAnswerLine,
	name: 'faq',
	orderings: [
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
		prepare: prepareFaqPreview,
		select: {
			department0: 'departments.0.title',
			department1: 'departments.1.title',
			department2: 'departments.2.title',
			departments: 'departments',
			title: 'question',
		},
	},
	title: 'FAQ',
	type: 'document',
});

export { prepareFaqPreview };
export default faq;
