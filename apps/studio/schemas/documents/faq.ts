// oxlint-disable no-magic-numbers

import { RiQuestionAnswerLine } from 'react-icons/ri';
import type { ValidationContext } from 'sanity';
import { defineArrayMember, defineField, defineType, getPublishedId } from 'sanity';
import { defineIncomingReferenceDecoration } from 'sanity/structure';

import externalLink from '../objects/external-link';
import internalLink from '../objects/internal-link';

/** The API version of the assignment check, the one the other studio checks use. */
const FAQ_API_VERSION = '2026-10-01';

const UNASSIGNED_WARNING =
	'Diese Frage steht in keiner Abteilung und erscheint deshalb nirgends auf der Website. Zuordnen lässt sie sich in der Abteilung, Tab „Inhalt“.';

/**
 * Builds the list preview of a FAQ: the question and the start of its answer. The departments that
 * show the question point at it, not the other way round, and a preview cannot follow such a
 * reference back.
 *
 * @param selection - The values selected by the preview.
 * @param selection.answer - The answer as Portable Text.
 * @param selection.title - The question.
 * @returns The preview value shown in document lists.
 */
function prepareFaqPreview({
	answer,
	title,
}: {
	answer?: readonly FaqPreviewBlock[];
	title?: string;
}): { subtitle?: string; title?: string } {
	const text = answer?.[0]?.children
		?.map((child) => child.text ?? '')
		.join('')
		.trim();

	return { subtitle: text === undefined || text === '' ? undefined : text, title };
}

/**
 * Warns while no department lists the question. Such a question appears nowhere on the website,
 * because only `faqs` of a department puts it on a page (WEB-431). A department draft or a release
 * version counts, so the check reads the raw perspective.
 *
 * @param document - The FAQ.
 * @param context - The validation context, for its client.
 * @returns `true`, or the message for an editor.
 */
async function validateFaqIsAssigned(
	document: { _id: string } | undefined,
	context: Pick<ValidationContext, 'getClient'>,
): Promise<string | true> {
	if (!document) {
		return true;
	}

	const isAssigned = await context
		.getClient({ apiVersion: FAQ_API_VERSION })
		.withConfig({ perspective: 'raw' })
		.fetch<boolean>('count(*[_type == "department" && $id in faqs[]._ref]) > 0', {
			id: getPublishedId(document._id),
		});

	return isAssigned ? true : UNASSIGNED_WARNING;
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
	],
	icon: RiQuestionAnswerLine,
	name: 'faq',
	orderings: [
		{
			by: [{ direction: 'asc', field: 'question' }],
			name: 'questionAsc',
			title: 'nach Frage - aufsteigend',
		},
		{
			by: [{ direction: 'desc', field: 'question' }],
			name: 'questionDesc',
			title: 'nach Frage - absteigend',
		},
	],
	preview: {
		prepare: prepareFaqPreview,
		select: { answer: 'answer', title: 'question' },
	},
	// Read only: the department assigns its questions, so the FAQ links nothing and creates nothing.
	renderMembers: (members) => [
		...members,
		defineIncomingReferenceDecoration({
			creationAllowed: false,
			name: 'usedIn',
			title: 'Verwendet in',
			types: [{ type: 'department' }],
		}),
	],
	title: 'FAQ',
	type: 'document',
	validation: (Rule) => Rule.custom(validateFaqIsAssigned).warning(),
});

/** One block of the answer, as far as the preview reads it. */
interface FaqPreviewBlock {
	children?: readonly { text?: string }[];
}

export { prepareFaqPreview, validateFaqIsAssigned };
export default faq;
