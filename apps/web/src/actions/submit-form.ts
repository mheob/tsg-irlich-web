'use server';

import { randomUUID } from 'node:crypto';

import { checkBotId } from 'botid/server';
import { revalidateTag } from 'next/cache';

import type { FormAnswer } from '@tsgi-web/shared';

import { actionClient } from '@/lib/actions/safe-action';
import { buildFormSchema } from '@/lib/forms/build-form-schema';
import { getRegisteredCount, submissionsTag } from '@/lib/forms/registered-count';
import { getRegistrationState } from '@/lib/forms/registration-state';
import type { RegistrationState } from '@/lib/forms/registration-state';
import { sendSubmissionMails } from '@/lib/forms/send-submission-mails';
import { getConfirmationRecipient, getSubmissionLabel, toAnswers } from '@/lib/forms/to-answers';
import type { FormValues } from '@/lib/forms/types';
import { client } from '@/lib/sanity/client';
import { formByIdQuery } from '@/lib/sanity/queries/forms';
import { getWriteClient } from '@/lib/sanity/write-client';
import { submitFormInputSchema } from '@/lib/validations/submit-form';
import type { SubmitFormStatus } from '@/lib/validations/submit-form';
import type { FormByIdQueryResult } from '@/types/sanity.types.generated';

const FORM_REVALIDATE_SECONDS = 60;

type Form = NonNullable<FormByIdQueryResult>;

async function loadForm(formId: string): Promise<Form> {
	const form = await client.fetch<FormByIdQueryResult>(
		formByIdQuery,
		{ id: formId },
		{ next: { revalidate: FORM_REVALIDATE_SECONDS, tags: ['form'] }, perspective: 'published' },
	);
	if (!form) {
		throw new Error('Unknown form');
	}
	return form;
}

async function getState(form: Form): Promise<RegistrationState> {
	return getRegistrationState({
		capacity: form.capacity,
		now: new Date(),
		// Without a limit nobody waits, so the count is not worth a request.
		registeredCount: form.capacity ? await getRegisteredCount(form._id) : 0,
		registrationEnd: form.registrationEnd,
		registrationStart: form.registrationStart,
	});
}

async function assertHuman(): Promise<void> {
	const verification = await checkBotId();
	if (verification.isBot) {
		throw new Error('Bot detected');
	}
}

/**
 * Validates the values against the form's own fields, stores them and expires the count.
 *
 * @param form - The form as `formByIdQuery` returns it.
 * @param values - What the visitor submitted.
 * @param status - Where the submission lands.
 * @returns What the mails need: the answers, the id of the stored document and the submitter's address.
 */
async function storeSubmission(
	form: Form,
	values: FormValues,
	status: 'registered' | 'waitlist',
): Promise<{ answers: FormAnswer[]; submissionId: string; submitterEmail: string | null }> {
	const parsed = buildFormSchema(form.fields).safeParse(values);
	if (!parsed.success) {
		throw new Error('Invalid submission');
	}

	const answers = toAnswers(form.fields, parsed.data);
	const label = getSubmissionLabel(form.fields, parsed.data);
	const submissionId = `form.submission.${randomUUID()}`;

	await getWriteClient().create({
		_id: submissionId,
		_type: 'form.submission',
		answers,
		form: { _ref: form._id, _type: 'reference' },
		...(label ? { label } : {}),
		status,
		submittedAt: new Date().toISOString(),
	});
	revalidateTag(submissionsTag(form._id), { expire: 0 });

	return {
		answers,
		submissionId,
		submitterEmail: getConfirmationRecipient(form.fields, parsed.data),
	};
}

/**
 * Loads the form with the state of its registration.
 *
 * @param formId - The `_id` of the form.
 * @returns The form and its state.
 */
async function loadOpenForm(formId: string): Promise<{ form: Form; state: RegistrationState }> {
	const form = await loadForm(formId);
	return { form, state: await getState(form) };
}

export const submitForm = actionClient
	.inputSchema(submitFormInputSchema)
	.action(async ({ parsedInput }): Promise<{ status: SubmitFormStatus }> => {
		// A human never sees this field. Answer as if it worked, so a bot learns nothing.
		if (parsedInput.website) {
			return { status: 'registered' };
		}
		await assertHuman();

		const { form, state } = await loadOpenForm(parsedInput.formId);
		if (state === 'upcoming' || state === 'closed') {
			return { status: state };
		}

		const status = state === 'waitlist' ? 'waitlist' : 'registered';
		const stored = await storeSubmission(form, parsedInput.values, status);
		await sendSubmissionMails({ ...stored, form, status });

		return { status };
	});
