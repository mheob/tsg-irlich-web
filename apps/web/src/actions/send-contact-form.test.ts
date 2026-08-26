import type { Resend } from 'resend';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ContactForwardEmail } from '@tsgi-web/email';

import type * as sendContactFormModule from '@/actions/send-contact-form';
import { resend } from '@/lib/resend';
import type { ContactFormData } from '@/lib/validations/contact-form';

import { loadWithEnv } from '../../test-utils/env';

type SendContactFormModule = typeof sendContactFormModule;

// `sendContactForm` calls `resend.emails.send` (see `src/lib/resend.ts`) directly, so the whole
// module is replaced with a fake `Resend` instance whose `emails.send` is a spy. This sidesteps
// `resend.ts`'s own `env('RESEND_API_KEY')` call at import time, so no `RESEND_API_KEY` stub is
// needed. The cast is necessary because the real `Resend` class carries many more readonly
// properties (`apiKeys`, `batch`, `contacts`, ...) that this fake never implements.
vi.mock(import('@/lib/resend'), () => ({
	resend: { emails: { send: vi.fn() } } as unknown as Resend,
}));

// `vi.mocked` only needs the reference to the mock function object; it is never invoked as a bare,
// unbound `this`-dependent call.
// oxlint-disable-next-line typescript/unbound-method
const mockedSend = vi.mocked(resend.emails.send);

// The action builds its email by calling `ContactForwardEmail({...})` directly (not as JSX), so
// mocking it turns that call's arguments into the observable "props handed to react" the task
// brief asks for — the value `react:` receives is otherwise just the fully rendered element tree,
// which does not expose the props it was built from.
vi.mock(import('@tsgi-web/email'), () => ({ ContactForwardEmail: vi.fn() }));

const mockedContactForwardEmail = vi.mocked(ContactForwardEmail);

// A stand-in for whatever `ContactForwardEmail(...)` returns, so the full-payload assertion below
// can compare `react` against a known value instead of describing a rendered element tree.
const CONTACT_FORWARD_EMAIL_STUB = 'contact-forward-email-stub' as unknown as ReturnType<
	typeof ContactForwardEmail
>;

// `next-safe-action`'s default `handleServerError` (see `create-linear-issue.test.ts` for the full
// citation) masks every thrown `Error` behind this fixed message in the envelope, logging the real
// message first via `console.error('Action error:', e.message)`.
const GENERIC_SERVER_ERROR = 'Something went wrong while executing the operation.';

const MESSAGE = 'Dies ist eine ausführliche Testnachricht für das Kontaktformular.';

function validContactInput(overrides: Partial<ContactFormData> = {}): ContactFormData {
	return {
		email: 'sender@example.com',
		message: MESSAGE,
		name: 'Max Mustermann',
		privacy: true,
		...overrides,
	};
}

function mockSendSuccess(): void {
	mockedSend.mockResolvedValue({
		data: { id: 'email-id-1' },
		error: null,
		headers: null,
	});
}

describe('choosing the email recipient', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		mockedSend.mockReset();
		mockedContactForwardEmail.mockReset();
	});

	it('sends to the receiver in production when one is given', async () => {
		mockSendSuccess();
		const { sendContactForm } = await loadWithEnv<SendContactFormModule>(
			'@/actions/send-contact-form',
			{ NODE_ENV: 'production' },
		);

		await sendContactForm(
			validContactInput({
				receiver: { email: 'trainer@tsg-irlich.de', label: 'Trainerteam Fußball' },
			}),
		);

		expect(mockedSend.mock.calls[0][0].to).toBe('trainer@tsg-irlich.de');
	});

	it('falls back to info@tsg-irlich.de in production without a receiver', async () => {
		mockSendSuccess();
		const { sendContactForm } = await loadWithEnv<SendContactFormModule>(
			'@/actions/send-contact-form',
			{ NODE_ENV: 'production' },
		);

		await sendContactForm(validContactInput());

		expect(mockedSend.mock.calls[0][0].to).toBe('info@tsg-irlich.de');
	});

	it('forces it@tsg-irlich.de outside production even when a receiver is given', async () => {
		mockSendSuccess();
		const { sendContactForm } = await loadWithEnv<SendContactFormModule>(
			'@/actions/send-contact-form',
			{ NODE_ENV: 'development' },
		);

		await sendContactForm(
			validContactInput({
				receiver: { email: 'trainer@tsg-irlich.de', label: 'Trainerteam Fußball' },
			}),
		);

		expect(mockedSend.mock.calls[0][0].to).toBe('it@tsg-irlich.de');
	});
});

describe('building the resend request', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		mockedSend.mockReset();
		mockedContactForwardEmail.mockReset();
	});

	it('sets bcc to it@tsg-irlich.de, replyTo to the sender and the exact subject', async () => {
		mockSendSuccess();
		mockedContactForwardEmail.mockReturnValue(CONTACT_FORWARD_EMAIL_STUB);
		const { sendContactForm } = await loadWithEnv<SendContactFormModule>(
			'@/actions/send-contact-form',
			{ NODE_ENV: 'development' },
		);

		await sendContactForm(
			validContactInput({ email: 'sender@example.com', name: 'Erika Musterfrau' }),
		);

		const [sendArgs] = mockedSend.mock.calls[0];
		// The full argument object, not a picked subset — this is the one case in the file that
		// guards `from` (and any unexpected extra field), so a regression that corrupts, drops or
		// hardcodes the wrong sender address would otherwise be invisible to this suite. `from` is
		// hard-coded from `send-contact-form.ts` rather than imported. `react` is matched against
		// the mocked `ContactForwardEmail`'s stubbed return value, since the mock's actual props are
		// covered by the dedicated test below.
		expect(sendArgs).toStrictEqual({
			bcc: ['it@tsg-irlich.de'],
			from: 'TSG Irlich - Benachrichtigungen <webseite@notifications.tsg-irlich.de>',
			react: CONTACT_FORWARD_EMAIL_STUB,
			replyTo: 'sender@example.com',
			subject: 'Webseiten-Kontaktformular: Neue Nachricht von Erika Musterfrau',
			to: 'it@tsg-irlich.de',
		});
	});

	it('passes the input-derived props to the contact forward email, plus a baseUrl', async () => {
		mockSendSuccess();
		const { sendContactForm } = await loadWithEnv<SendContactFormModule>(
			'@/actions/send-contact-form',
			{ NODE_ENV: 'development' },
		);

		await sendContactForm(
			validContactInput({
				email: 'sender@example.com',
				message: MESSAGE,
				name: 'Erika Musterfrau',
				receiver: { email: 'trainer@tsg-irlich.de', label: 'Trainerteam Fußball' },
			}),
		);

		const [props] = mockedContactForwardEmail.mock.calls[0];
		expect(mockedContactForwardEmail).toHaveBeenCalledOnce();
		// The whole prop object, not a subset — `baseUrl` is pinned to a literal rather than merely
		// typed. `getBaseUrl()` (`src/utils/url.ts`) checks `VERCEL_PROJECT_PRODUCTION_URL` first, which
		// is left unstubbed by the `{ NODE_ENV: 'development' }` env below and is unset in this test
		// run, then `NODE_ENV`, which is `'development'` here — so it falls through to the localhost
		// default. Hard-coded here rather than imported, per the "never derive an expected value from a
		// constant the implementation also imports" rule.
		expect(props).toStrictEqual({
			baseUrl: 'http://localhost:3000',
			contactEmail: 'sender@example.com',
			contactMessage: MESSAGE,
			contactName: 'Erika Musterfrau',
			receiver: 'Trainerteam Fußball',
		});
	});
});

describe('surfacing a resend failure', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		mockedSend.mockReset();
		mockedContactForwardEmail.mockReset();
	});

	it('surfaces "Email could not be sent" when resend returns an error, after logging it', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();
		const resendError = {
			message: 'Missing required field',
			name: 'missing_required_field' as const,
			statusCode: 422,
		};
		mockedSend.mockResolvedValue({ data: null, error: resendError, headers: null });
		const { sendContactForm } = await loadWithEnv<SendContactFormModule>(
			'@/actions/send-contact-form',
			{ NODE_ENV: 'development' },
		);

		const result = await sendContactForm(validContactInput());

		expect(result).toStrictEqual({ serverError: GENERIC_SERVER_ERROR });
		expect(errorSpy).toHaveBeenCalledWith('Resend API error:', resendError);
		expect(errorSpy).toHaveBeenCalledWith('Action error:', 'Email could not be sent');
	});
});

describe('validating the submitted input', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		mockedSend.mockReset();
		mockedContactForwardEmail.mockReset();
	});

	it('never calls send when the input fails contactFormSchema', async () => {
		const { sendContactForm } = await loadWithEnv<SendContactFormModule>(
			'@/actions/send-contact-form',
			{ NODE_ENV: 'development' },
		);

		const result = await sendContactForm(validContactInput({ message: 'zu kurz' }));

		expect(result).toStrictEqual({
			validationErrors: {
				message: { _errors: ['Die Nachricht muss mindestens 32 Zeichen lang sein.'] },
			},
		});
		expect(mockedSend).not.toHaveBeenCalled();
	});
});
