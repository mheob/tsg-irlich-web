import { RiInboxArchiveLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from '@tsgi-web/shared';

const submittedAtFormat = new Intl.DateTimeFormat('de-DE', {
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	month: '2-digit',
	timeZone: 'Europe/Berlin',
	year: 'numeric',
});

/**
 * Builds the list preview of a submission: the label and "<status> · <date and time>".
 *
 * @param selection - The values selected by the preview.
 * @param selection.label - The label of the submission.
 * @param selection.status - The status key.
 * @param selection.submittedAt - The ISO date time of the submission.
 * @returns The preview value shown in document lists.
 */
function prepareSubmissionPreview({
	label,
	status,
	submittedAt,
}: {
	label?: string;
	status?: SubmissionStatus;
	submittedAt?: string;
}): { subtitle: string; title: string } {
	const statusLabel = status ? SUBMISSION_STATUS_LABELS[status] : undefined;
	const date = submittedAt
		? submittedAtFormat.format(new Date(submittedAt)).replace(',', '')
		: undefined;

	return {
		subtitle: [statusLabel, date].filter(Boolean).join(' · '),
		title: label ?? 'Ohne Bezeichnung',
	};
}

const formSubmission = defineType({
	fields: [
		defineField({
			name: 'form',
			readOnly: true,
			title: 'Formular',
			to: [{ type: 'form' }],
			type: 'reference',
		}),
		defineField({
			name: 'submittedAt',
			readOnly: true,
			title: 'Eingegangen am',
			type: 'datetime',
		}),
		defineField({
			name: 'status',
			options: {
				layout: 'radio',
				list: [
					{ title: SUBMISSION_STATUS_LABELS.registered, value: 'registered' },
					{ title: SUBMISSION_STATUS_LABELS.waitlist, value: 'waitlist' },
					{ title: SUBMISSION_STATUS_LABELS.cancelled, value: 'cancelled' },
				],
			},
			title: 'Status',
			type: 'string',
			validation: (Rule) => Rule.required().error('Status ist erforderlich'),
		}),
		defineField({ name: 'label', readOnly: true, title: 'Bezeichnung', type: 'string' }),
		defineField({
			name: 'answers',
			of: [defineArrayMember({ type: 'formAnswer' })],
			title: 'Antworten',
			type: 'array',
		}),
		defineField({ name: 'cleanedAt', readOnly: true, title: 'Bereinigt am', type: 'datetime' }),
	],
	icon: RiInboxArchiveLine,
	liveEdit: true,
	name: 'form.submission',
	preview: {
		prepare: prepareSubmissionPreview,
		select: { label: 'label', status: 'status', submittedAt: 'submittedAt' },
	},
	title: 'Eingang',
	type: 'document',
});

export { prepareSubmissionPreview };
export default formSubmission;
