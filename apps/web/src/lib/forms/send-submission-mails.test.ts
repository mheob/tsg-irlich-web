import type { CreateEmailOptions, Resend } from 'resend';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FormSubmissionConfirmationEmail, FormSubmissionNotificationEmail } from '@tsgi-web/email';
import { FORM_DEFAULT_TEXTS } from '@tsgi-web/shared';
import type { FormAnswer } from '@tsgi-web/shared';

import { resend } from '@/lib/resend';
import type { FormByIdQueryResult } from '@/types/sanity.types.generated';

import { loadWithEnv } from '../../../test-utils/env';
import type * as sendSubmissionMailsModule from './send-submission-mails';

type SendSubmissionMailsModule = typeof sendSubmissionMailsModule;
type Form = NonNullable<FormByIdQueryResult>;

vi.mock(import('@/lib/resend'), () => ({
	resend: { emails: { send: vi.fn() } } as unknown as Resend,
}));

vi.mock(import('@tsgi-web/email'), () => ({
	FormSubmissionConfirmationEmail: vi.fn(),
	FormSubmissionNotificationEmail: vi.fn(),
}));

// oxlint-disable-next-line typescript/unbound-method
const mockedSend = vi.mocked(resend.emails.send);
const mockedNotification = vi.mocked(FormSubmissionNotificationEmail);
const mockedConfirmation = vi.mocked(FormSubmissionConfirmationEmail);

const SENDER = 'TSG Irlich - Benachrichtigungen <webseite@notifications.tsg-irlich.de>';

const ANSWERS: FormAnswer[] = [
	{
		_key: 'a1',
		_type: 'formAnswer',
		fieldType: 'formFieldText',
		key: 'team',
		label: 'Teamname',
		value: 'Die Dorfhelden',
	},
	{
		_key: 'a2',
		_type: 'formAnswer',
		fieldType: 'formFieldText',
		key: 'address',
		label: 'Adresse',
		retention: 'delete',
		value: 'Hauptstr. 1',
	},
];

function buildForm(overrides: Partial<Form> = {}): Form {
	return {
		_id: 'form-1',
		capacity: null,
		confirmationSubject: null,
		confirmationText: 'Danke für deine Anmeldung.',
		eventDate: null,
		fields: [],
		formType: 'registration',
		includeAnswersInConfirmation: false,
		location: null,
		notifyOrganizer: true,
		receivers: [
			{ email: 'orga@tsg-irlich.de', name: 'Orga' },
			{ email: 'zweite@tsg-irlich.de', name: 'Zweite' },
		],
		registrationEnd: null,
		registrationStart: null,
		sendConfirmation: true,
		slug: 'dorfturnier',
		title: 'Dorfturnier',
		waitlistConfirmationText: 'Du stehst auf der Warteliste.',
		...overrides,
	};
}

async function sendMails(
	input: Partial<Parameters<SendSubmissionMailsModule['sendSubmissionMails']>[0]> = {},
	nodeEnv = 'production',
): Promise<void> {
	const { sendSubmissionMails } = await loadWithEnv<SendSubmissionMailsModule>(
		'@/lib/forms/send-submission-mails',
		{ NODE_ENV: nodeEnv, NEXT_PUBLIC_SANITY_STUDIO_URL: 'https://studio.example.com' },
	);
	await sendSubmissionMails({
		answers: ANSWERS,
		form: buildForm(),
		replyToSubmitter: true,
		status: 'registered',
		submissionId: 'form.submission.abc',
		submitterEmail: 'team@example.com',
		...input,
	});
}

function sentTo(subjectStart: string): CreateEmailOptions | undefined {
	return mockedSend.mock.calls
		.map(([payload]) => payload)
		.find((payload) => payload.subject?.startsWith(subjectStart));
}

describe('submission mails', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		mockedSend.mockReset();
		mockedNotification.mockReset();
		mockedConfirmation.mockReset();
	});

	it('mails the organizer without hidden fields and with the studio link', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails();

		expect(sentTo('Neuer Eingang')).toMatchObject({
			from: SENDER,
			replyTo: 'team@example.com',
			subject: 'Neuer Eingang: Dorfturnier',
			to: ['orga@tsg-irlich.de', 'zweite@tsg-irlich.de'],
		});
		expect(mockedNotification).toHaveBeenCalledExactlyOnceWith({
			formTitle: 'Dorfturnier',
			hasHiddenFields: true,
			sections: [{ rows: [{ label: 'Teamname', value: 'Die Dorfhelden' }] }],
			status: 'registered',
			studioUrl:
				'https://studio.example.com/intent/edit/id=form.submission.abc;type=form.submission',
		});
	});

	it('marks the waitlist in the organizer subject', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails({ status: 'waitlist' });

		expect(sentTo('Neuer Eingang')?.subject).toBe('Neuer Eingang: Dorfturnier (Warteliste)');
	});

	it('sends the confirmation to the marked email', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails();

		expect(sentTo('Deine Anmeldung')).toMatchObject({
			from: SENDER,
			replyTo: 'orga@tsg-irlich.de',
			subject: 'Deine Anmeldung: Dorfturnier',
			to: 'team@example.com',
		});
		expect(mockedConfirmation).toHaveBeenCalledExactlyOnceWith({
			formTitle: 'Dorfturnier',
			hasHiddenFields: true,
			sections: undefined,
			text: 'Danke für deine Anmeldung.',
		});
	});

	it('uses the custom confirmation subject', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails({ form: buildForm({ confirmationSubject: 'Willkommen!' }) });

		expect(sentTo('Willkommen!')).toBeDefined();
	});

	it('uses the waitlist text for waitlist submissions', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails({ status: 'waitlist' });

		expect(mockedConfirmation.mock.calls[0][0].text).toBe('Du stehst auf der Warteliste.');
	});

	it('falls back to the default texts', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });
		const form = buildForm({ confirmationText: null, waitlistConfirmationText: null });

		await sendMails({ form });
		await sendMails({ form, status: 'waitlist' });

		expect(mockedConfirmation.mock.calls.map(([props]) => props.text)).toStrictEqual([
			FORM_DEFAULT_TEXTS.success,
			FORM_DEFAULT_TEXTS.waitlistSuccess,
		]);
	});

	it('includes answers only when configured', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails({ form: buildForm({ includeAnswersInConfirmation: true }) });

		expect(mockedConfirmation.mock.calls[0][0]).toMatchObject({
			hasHiddenFields: true,
			sections: [{ rows: [{ label: 'Teamname', value: 'Die Dorfhelden' }] }],
		});
	});

	it('sends everything to it@ outside production', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails({}, 'test');

		expect(mockedSend.mock.calls.map(([payload]) => payload.to)).toStrictEqual([
			'it@tsg-irlich.de',
			'it@tsg-irlich.de',
		]);
	});

	it('skips the organizer mail when disabled or without receivers', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails({ form: buildForm({ notifyOrganizer: false }) });
		await sendMails({ form: buildForm({ receivers: null }) });

		expect(mockedNotification).not.toHaveBeenCalled();
		expect(sentTo('Neuer Eingang')).toBeUndefined();
	});

	it('skips the confirmation without a recipient or when disabled', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails({ submitterEmail: null });
		await sendMails({ form: buildForm({ sendConfirmation: false }) });

		expect(mockedConfirmation).not.toHaveBeenCalled();
	});

	it('omits the reply address without a submitter or receiver', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails({ form: buildForm({ receivers: [] }) });
		await sendMails({ submitterEmail: null });

		expect(sentTo('Deine Anmeldung')).not.toHaveProperty('replyTo');
		expect(sentTo('Neuer Eingang')).not.toHaveProperty('replyTo');
	});

	it('does not reply to a submitter whose address is cleaned up', async () => {
		mockedSend.mockResolvedValue({ data: { id: '1' }, error: null, headers: null });

		await sendMails({ replyToSubmitter: false });

		expect(sentTo('Neuer Eingang')).not.toHaveProperty('replyTo');
		expect(sentTo('Neuer Eingang')).not.toHaveProperty('bcc');
		expect(sentTo('Deine Anmeldung')).toMatchObject({ to: 'team@example.com' });
		expect(sentTo('Deine Anmeldung')).not.toHaveProperty('bcc');
	});

	it('logs instead of throwing', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();
		mockedSend.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({
			data: null,
			error: { message: 'rejected', name: 'validation_error', statusCode: 422 },
			headers: null,
		});

		await expect(sendMails()).resolves.toBeUndefined();

		expect(errorSpy).toHaveBeenCalledTimes(2);
		expect(errorSpy).toHaveBeenNthCalledWith(1, 'Form mail failed:', expect.any(Error));
		expect(errorSpy).toHaveBeenNthCalledWith(
			2,
			'Form mail failed:',
			expect.objectContaining({ message: 'rejected' }),
		);
	});
});
