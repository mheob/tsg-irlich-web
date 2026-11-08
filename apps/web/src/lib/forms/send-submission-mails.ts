import type { CreateEmailOptions } from 'resend';

import { FormSubmissionConfirmationEmail, FormSubmissionNotificationEmail } from '@tsgi-web/email';
import { FORM_DEFAULT_TEXTS, settle } from '@tsgi-web/shared';
import type { FormAnswer } from '@tsgi-web/shared';

import { env } from '@/lib/env';
import { resend } from '@/lib/resend';
import { studioUrl } from '@/lib/sanity/api';
import type { FormByIdQueryResult } from '@/types/sanity.types.generated';

import { toEmailSections } from './email-sections';

const SENDER = 'TSG Irlich - Benachrichtigungen <webseite@notifications.tsg-irlich.de>';
const DEVELOPMENT_RECEIVER = 'it@tsg-irlich.de';

type Form = NonNullable<FormByIdQueryResult>;

interface SendSubmissionMailsInput {
	answers: FormAnswer[];
	form: Form;
	status: 'registered' | 'waitlist';
	submissionId: string;
	submitterEmail: string | null;
}

/**
 * Sends one mail and logs a failure, so the submission that is already stored still succeeds.
 *
 * @param payload - The mail.
 */
async function sendMail(payload: CreateEmailOptions): Promise<void> {
	const outcome = await settle(resend.emails.send(payload));
	if (!outcome.ok) {
		console.error('Form mail failed:', outcome.error);
	} else if (outcome.value.error) {
		console.error('Form mail failed:', outcome.value.error);
	}
}

/**
 * An editor who clears a text field leaves an empty string behind, which is no text either.
 *
 * @param value - The text the editor wrote, if any.
 * @param fallback - What to use without one.
 * @returns The text or the fallback.
 */
function textOr(value: string | null, fallback: string): string {
	return value === null || value === '' ? fallback : value;
}

function isProduction(): boolean {
	return env('NODE_ENV') === 'production';
}

async function sendOrganizerMail(
	{ answers, form, status, submissionId, submitterEmail }: SendSubmissionMailsInput,
	receivers: string[],
): Promise<void> {
	const { hasHiddenFields, sections } = toEmailSections(answers);
	await sendMail({
		from: SENDER,
		react: FormSubmissionNotificationEmail({
			formTitle: form.title,
			hasHiddenFields,
			sections,
			status,
			studioUrl: `${studioUrl}/intent/edit/id=${submissionId};type=form.submission`,
		}),
		...(submitterEmail ? { replyTo: submitterEmail } : {}),
		subject: `Neuer Eingang: ${form.title}${status === 'waitlist' ? ' (Warteliste)' : ''}`,
		to: isProduction() ? receivers : DEVELOPMENT_RECEIVER,
	});
}

async function sendConfirmationMail(
	{ answers, form, status }: SendSubmissionMailsInput,
	recipient: string,
	replyTo: string | undefined,
): Promise<void> {
	const { hasHiddenFields, sections } = toEmailSections(answers);
	const text =
		status === 'waitlist'
			? textOr(form.waitlistConfirmationText, FORM_DEFAULT_TEXTS.waitlistSuccess)
			: textOr(form.confirmationText, FORM_DEFAULT_TEXTS.success);
	await sendMail({
		from: SENDER,
		react: FormSubmissionConfirmationEmail({
			formTitle: form.title,
			hasHiddenFields,
			sections: form.includeAnswersInConfirmation ? sections : undefined,
			text,
		}),
		...(replyTo ? { replyTo } : {}),
		subject: textOr(form.confirmationSubject, `Deine Anmeldung: ${form.title}`),
		to: isProduction() ? recipient : DEVELOPMENT_RECEIVER,
	});
}

/**
 * Sends the notification to the organizers and the confirmation to the submitter, as far as the
 * form asks for them. Outside production every mail goes to the IT address. It never throws: the
 * submission is stored already, so a failed mail is logged and nothing else.
 *
 * @param input - The stored answers, the form, the status, the id of the stored submission and
 * the address of the submitter.
 * @param input.answers - The stored answers.
 * @param input.form - The form as `formByIdQuery` returns it.
 * @param input.status - Where the submission landed.
 * @param input.submissionId - The `_id` of the stored submission, for the studio link.
 * @param input.submitterEmail - The value of the email field marked as the recipient, if any.
 */
async function sendSubmissionMails(input: SendSubmissionMailsInput): Promise<void> {
	const { form, submitterEmail } = input;
	const receivers = (form.receivers ?? []).map((receiver) => receiver.email).filter(Boolean);
	const mails: Promise<void>[] = [];

	if (form.notifyOrganizer && receivers.length > 0) {
		mails.push(sendOrganizerMail(input, receivers));
	}
	if (form.sendConfirmation && submitterEmail) {
		mails.push(sendConfirmationMail(input, submitterEmail, receivers[0]));
	}

	await Promise.all(mails);
}

export { sendSubmissionMails };
