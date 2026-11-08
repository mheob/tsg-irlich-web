import { checkBotId } from 'botid/server';
import { revalidateTag } from 'next/cache';
import type { Resend } from 'resend';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { resend } from '@/lib/resend';
import type { client } from '@/lib/sanity/client';
import { formByIdQuery } from '@/lib/sanity/queries/forms';
import { getWriteClient } from '@/lib/sanity/write-client';
import type { FormByIdQueryResult } from '@/types/sanity.types.generated';

import { field } from '../../test-utils/form-fields';
import { clientFetchMock } from '../../test-utils/sanity-client-mock';
import { submitForm } from './submit-form';

type Form = NonNullable<FormByIdQueryResult>;

vi.mock(import('botid/server'), () => ({ checkBotId: vi.fn() }));
vi.mock(import('next/cache'), () => ({ revalidateTag: vi.fn() }));
vi.mock(import('@/lib/resend'), () => ({
	resend: { emails: { send: vi.fn() } } as unknown as Resend,
}));
vi.mock(import('@tsgi-web/email'), () => ({
	FormSubmissionConfirmationEmail: vi.fn(),
	FormSubmissionNotificationEmail: vi.fn(),
}));
vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));
vi.mock(import('@/lib/sanity/write-client'), () => ({ getWriteClient: vi.fn() }));

const mockedCheckBotId = vi.mocked(checkBotId);
const mockedRevalidateTag = vi.mocked(revalidateTag);
// oxlint-disable-next-line typescript/unbound-method
const mockedSend = vi.mocked(resend.emails.send);
const mockedGetWriteClient = vi.mocked(getWriteClient);
const mockedFetch = clientFetchMock();
const writeFetch = vi.fn<(...args: unknown[]) => Promise<unknown>>();
const writeCreate = vi.fn<(...args: unknown[]) => Promise<unknown>>();

const GENERIC_SERVER_ERROR = 'Something went wrong while executing the operation.';

const FORM: Form = {
	_id: 'form-1',
	capacity: 2,
	confirmationSubject: null,
	confirmationText: null,
	eventDate: null,
	fields: [
		field('formFieldText', 'team', 'Teamname', { isLabel: true, isRequired: true, maxLength: 40 }),
		field('formFieldEmail', 'mail', 'E-Mail', { isConfirmationRecipient: true, isRequired: true }),
	] as Form['fields'],
	formType: 'registration',
	includeAnswersInConfirmation: false,
	location: null,
	notifyOrganizer: true,
	receivers: [{ email: 'orga@tsg-irlich.de', name: 'Orga' }],
	registrationEnd: null,
	registrationStart: null,
	sendConfirmation: true,
	slug: 'dorfturnier',
	title: 'Dorfturnier',
	waitlistConfirmationText: null,
};

const VALUES = { mail: 'team@example.com', team: 'Chicken Friends' };

async function submit(
	overrides: { values?: Record<string, unknown>; website?: string } = {},
): ReturnType<typeof submitForm> {
	const result = await submitForm({ formId: 'form-1', values: VALUES, ...overrides });
	return result;
}

describe('submitting a form', () => {
	beforeEach(() => {
		mockedCheckBotId.mockResolvedValue({
			bypassed: false,
			isBot: false,
			isHuman: true,
			isVerifiedBot: false,
		});
		mockedFetch.mockResolvedValue(FORM);
		writeFetch.mockResolvedValue(0);
		writeCreate.mockResolvedValue({});
		mockedGetWriteClient.mockReturnValue({
			create: writeCreate,
			fetch: writeFetch,
		} as unknown as ReturnType<typeof getWriteClient>);
		mockedSend.mockResolvedValue({ data: { id: 'mail-1' }, error: null, headers: null });
	});

	afterEach(() => {
		vi.restoreAllMocks();
		mockedCheckBotId.mockReset();
		mockedRevalidateTag.mockReset();
		mockedSend.mockReset();
		mockedGetWriteClient.mockReset();
		mockedFetch.mockReset();
		writeFetch.mockReset();
		writeCreate.mockReset();
	});

	it('returns registered for a filled honeypot without writing', async () => {
		const result = await submit({ website: 'https://spam.example' });

		expect(result).toStrictEqual({ data: { status: 'registered' } });
		expect(mockedCheckBotId).not.toHaveBeenCalled();
		expect(mockedFetch).not.toHaveBeenCalled();
		expect(writeCreate).not.toHaveBeenCalled();
	});

	it('rejects bots', async () => {
		vi.spyOn(console, 'error').mockReturnValue();
		mockedCheckBotId.mockResolvedValue({
			bypassed: false,
			isBot: true,
			isHuman: false,
			isVerifiedBot: false,
		});

		const result = await submit();

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(mockedFetch).not.toHaveBeenCalled();
		expect(writeCreate).not.toHaveBeenCalled();
	});

	it('rejects an unknown form', async () => {
		vi.spyOn(console, 'error').mockReturnValue();
		mockedFetch.mockResolvedValue(null);

		const result = await submit();

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(mockedFetch).toHaveBeenCalledExactlyOnceWith(
			formByIdQuery,
			{ id: 'form-1' },
			{ next: { revalidate: 60, tags: ['form'] }, perspective: 'published' },
		);
		expect(writeCreate).not.toHaveBeenCalled();
	});

	it('returns upcoming before the start without writing', async () => {
		mockedFetch.mockResolvedValue({ ...FORM, registrationStart: '2999-01-01T00:00:00Z' });

		await expect(submit()).resolves.toStrictEqual({ data: { status: 'upcoming' } });
		expect(writeCreate).not.toHaveBeenCalled();
	});

	it('returns closed after the end without writing', async () => {
		mockedFetch.mockResolvedValue({ ...FORM, registrationEnd: '2000-01-01T00:00:00Z' });

		await expect(submit()).resolves.toStrictEqual({ data: { status: 'closed' } });
		expect(writeCreate).not.toHaveBeenCalled();
	});

	it('rejects invalid values', async () => {
		vi.spyOn(console, 'error').mockReturnValue();

		const result = await submit({ values: { mail: 'kaputt', team: '' } });

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(writeCreate).not.toHaveBeenCalled();
	});

	it('stores a registered submission with a dot id and the answers', async () => {
		const result = await submit();

		expect(result).toStrictEqual({ data: { status: 'registered' } });
		expect(writeCreate).toHaveBeenCalledOnce();
		const [document] = writeCreate.mock.calls[0] as [Record<string, unknown>];
		expect(document).toMatchObject({
			_type: 'form.submission',
			form: { _ref: 'form-1', _type: 'reference' },
			label: 'Chicken Friends',
			status: 'registered',
		});
		expect(document._id).toMatch(/^form\.submission\.[0-9a-f-]{36}$/u);
		expect(document.answers).toMatchObject([
			{ key: 'team', value: 'Chicken Friends' },
			{ key: 'mail', value: 'team@example.com' },
		]);
	});

	it('leaves the label out when no field names the submission', async () => {
		mockedFetch.mockResolvedValue({
			...FORM,
			fields: [field('formFieldText', 'team', 'Teamname', { isRequired: true })] as Form['fields'],
		});

		await submit();

		expect(writeCreate.mock.calls[0][0]).not.toHaveProperty('label');
	});

	it('leaves the label out when its field is cleaned up', async () => {
		mockedFetch.mockResolvedValue({
			...FORM,
			fields: [
				field('formFieldText', 'team', 'Teamname', { isLabel: true, retention: 'delete' }),
			] as Form['fields'],
		});

		await submit();

		expect(writeCreate.mock.calls[0][0]).not.toHaveProperty('label');
	});

	it('replies to the field marked as recipient, not the first email field', async () => {
		mockedFetch.mockResolvedValue({
			...FORM,
			fields: [
				field('formFieldEmail', 'first', 'Erste'),
				field('formFieldEmail', 'second', 'Zweite', { isConfirmationRecipient: true }),
			] as Form['fields'],
		});

		await submit({ values: { first: 'a@example.com', second: 'b@example.com' } });

		const payloads = mockedSend.mock.calls.map(([payload]) => payload);
		const organizer = payloads.find((payload) => payload.subject?.startsWith('Neuer Eingang'));
		expect(organizer?.replyTo).toBe('b@example.com');
		expect(organizer).not.toHaveProperty('bcc');
	});

	it('sends no reply address when the recipient field is cleaned up', async () => {
		mockedFetch.mockResolvedValue({
			...FORM,
			fields: [
				field('formFieldEmail', 'mail', 'E-Mail', {
					isConfirmationRecipient: true,
					retention: 'delete',
				}),
			] as Form['fields'],
		});

		await submit({ values: { mail: 'b@example.com' } });

		const payloads = mockedSend.mock.calls.map(([payload]) => payload);
		const organizer = payloads.find((payload) => payload.subject?.startsWith('Neuer Eingang'));
		expect(organizer).not.toHaveProperty('replyTo');
		expect(organizer).not.toHaveProperty('bcc');
	});

	it('stamps the submission with the current time', async () => {
		await submit();

		const [document] = writeCreate.mock.calls[0] as [{ submittedAt: string }];
		expect(new Date(document.submittedAt).toISOString()).toBe(document.submittedAt);
	});

	it('stores a waitlist submission when capacity is reached', async () => {
		writeFetch.mockResolvedValue(2);

		const result = await submit();

		expect(result).toStrictEqual({ data: { status: 'waitlist' } });
		expect(writeCreate.mock.calls[0][0]).toMatchObject({ status: 'waitlist' });
	});

	it('does not count registrations for a form without capacity', async () => {
		mockedFetch.mockResolvedValue({ ...FORM, capacity: null });

		await submit();

		expect(writeFetch).not.toHaveBeenCalled();
		expect(writeCreate).toHaveBeenCalledOnce();
	});

	it('revalidates the submissions tag', async () => {
		await submit();

		expect(mockedRevalidateTag).toHaveBeenCalledExactlyOnceWith('form-submissions:form-1', {
			expire: 0,
		});
	});

	it('mails the organizer and the submitter', async () => {
		await submit();

		expect(mockedSend).toHaveBeenCalledTimes(2);
	});

	it('still succeeds when the mails fail', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();
		mockedSend.mockRejectedValue(new Error('network'));

		const result = await submit();

		expect(result).toStrictEqual({ data: { status: 'registered' } });
		expect(errorSpy).toHaveBeenCalledWith('Form mail failed:', expect.any(Error));
	});
});
