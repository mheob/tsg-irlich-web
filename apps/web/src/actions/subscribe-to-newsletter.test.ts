import { headers } from 'next/headers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as subscribeToNewsletterModule from '@/actions/subscribe-to-newsletter';
import type * as cleverreachModule from '@/lib/cleverreach';

import { loadWithEnv } from '../../test-utils/env';
import { createFetchMock, type FetchCall } from '../../test-utils/fetch-mock';

type SubscribeToNewsletterModule = typeof subscribeToNewsletterModule;
type CleverreachModule = typeof cleverreachModule;

// `getRequestMetadata` in `subscribe-to-newsletter.ts` reads the referer, user agent and
// `x-forwarded-for` headers through `await headers()`, so `next/headers` has to be mocked. The
// static import above gives `vi.mocked` a typed handle on the same mock the dynamically
// re-imported action (via `loadWithEnv`) resolves to.
vi.mock(import('next/headers'), () => ({ headers: vi.fn() }));

const mockedHeaders = vi.mocked(headers);

const CLEVERREACH_ENV = {
	CLEVERREACH_CLIENT_ID: 'test-client-id',
	CLEVERREACH_CLIENT_SECRET: 'test-client-secret',
	CLEVERREACH_FORM_ID: 'test-form-id',
	CLEVERREACH_LIST_ID: 'test-list-id',
};

/**
 * Parses a recorded fetch call's JSON body. See `src/lib/cleverreach.test.ts` for the identical
 * helper — kept local rather than shared, since `test-utils/` is not to be modified for this task.
 *
 * @param call - The recorded fetch call to read the body from.
 * @returns The parsed JSON body.
 */
function parseJsonBody(call: FetchCall): unknown {
	if (!call.body) {
		throw new Error(`Expected a JSON string body for ${call.url}`);
	}
	return JSON.parse(call.body);
}

function emailFormData(email: string): FormData {
	const formData = new FormData();
	formData.set('email', email);
	return formData;
}

describe('validating the submitted email before contacting cleverreach', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('returns the validation error state when the email field is missing, without any fetch', async () => {
		mock = createFetchMock();
		const { subscribeToNewsletter } = await loadWithEnv<SubscribeToNewsletterModule>(
			'@/actions/subscribe-to-newsletter',
			CLEVERREACH_ENV,
		);

		const result = await subscribeToNewsletter(null, new FormData());

		expect(result).toStrictEqual({
			error: undefined,
			message: 'Bitte überprüfe Deine Eingaben.',
			success: false,
			title: 'Fehler',
		});
		expect(mock.calls).toStrictEqual([]);
	});

	it('returns the validation error state for an invalid email address, without any fetch', async () => {
		mock = createFetchMock();
		const { subscribeToNewsletter } = await loadWithEnv<SubscribeToNewsletterModule>(
			'@/actions/subscribe-to-newsletter',
			CLEVERREACH_ENV,
		);

		const result = await subscribeToNewsletter(null, emailFormData('not-an-email'));

		expect(result).toStrictEqual({
			error: undefined,
			message: 'Bitte überprüfe Deine Eingaben.',
			success: false,
			title: 'Fehler',
		});
		expect(mock.calls).toStrictEqual([]);
	});
});

describe('resolving the request metadata for the DOI email', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('takes the first ip from a multi-value x-forwarded-for header, trimmed', async () => {
		mockedHeaders.mockResolvedValue(
			new Headers({
				referer: 'https://tsg-irlich.de/newsletter',
				'user-agent': 'TestAgent/2.0',
				'x-forwarded-for': ' 203.0.113.9 , 10.0.0.5',
			}),
		);
		mock = createFetchMock();
		const { subscribeToNewsletter } = await loadWithEnv<SubscribeToNewsletterModule>(
			'@/actions/subscribe-to-newsletter',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		await subscribeToNewsletter(null, emailFormData('person@example.com'));

		expect(parseJsonBody(mock.calls[2])).toStrictEqual({
			doidata: {
				referer: 'https://tsg-irlich.de/newsletter',
				user_agent: 'TestAgent/2.0',
				user_ip: '203.0.113.9',
			},
			email: 'person@example.com',
			groups_ids: ['test-list-id'],
		});
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('falls back to an empty referer, the default user agent and the default ip when headers are missing', async () => {
		mockedHeaders.mockResolvedValue(new Headers());
		mock = createFetchMock();
		const { subscribeToNewsletter } = await loadWithEnv<SubscribeToNewsletterModule>(
			'@/actions/subscribe-to-newsletter',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		await subscribeToNewsletter(null, emailFormData('person@example.com'));

		expect(parseJsonBody(mock.calls[2])).toStrictEqual({
			doidata: {
				referer: '',
				user_agent: 'Mozilla/5.0',
				user_ip: '0.0.0.0',
			},
			email: 'person@example.com',
			groups_ids: ['test-list-id'],
		});
		expect(mock.unqueued).toStrictEqual([]);
	});
});

describe('mapping a cleverreach failure to its german message', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.doUnmock('@/lib/cleverreach');
		vi.restoreAllMocks();
	});

	it('maps ALREADY_SUBSCRIBED to its german message', async () => {
		mockedHeaders.mockResolvedValue(new Headers());
		mock = createFetchMock();
		const { subscribeToNewsletter } = await loadWithEnv<SubscribeToNewsletterModule>(
			'@/actions/subscribe-to-newsletter',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueue({ body: JSON.stringify({}), status: 409 });

		const result = await subscribeToNewsletter(null, emailFormData('person@example.com'));

		expect(result).toStrictEqual({
			error: 'This email is already subscribed',
			message: 'Diese E-Mail-Adresse ist bereits für den Newsletter registriert.',
			success: false,
			title: 'Fehler',
		});
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('maps INTERNAL_ERROR to its german message', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();
		mockedHeaders.mockResolvedValue(new Headers());
		mock = createFetchMock();
		const { subscribeToNewsletter } = await loadWithEnv<SubscribeToNewsletterModule>(
			'@/actions/subscribe-to-newsletter',
			CLEVERREACH_ENV,
		);

		mock.enqueue({ body: 'invalid_client', status: 401 });

		const result = await subscribeToNewsletter(null, emailFormData('person@example.com'));

		expect(result).toStrictEqual({
			error: 'An unexpected error occurred. Please try again later.',
			message: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
			success: false,
			title: 'Fehler',
		});
		expect(errorSpy).toHaveBeenCalledWith(
			'CleverReach subscription error:',
			expect.objectContaining({
				message: 'CleverReach authentication failed: invalid_client',
			}),
		);
		expect(mock.unqueued).toStrictEqual([]);
	});

	// `subscribe()`'s own `VALIDATION_ERROR` branch (in `src/lib/cleverreach.ts`) re-runs the exact
	// same `subscriberSchema` this action already validated the email against in `validateEmail`, so
	// a value that reaches `subscribe()` from this action can never fail that second parse — the
	// branch is unreachable "by shaping the CleverReach responses" as the task brief suggested.
	// `@/lib/cleverreach`'s `subscribe` export is stubbed directly for this one case instead, to
	// exercise `toErrorState`'s mapping for a code that is otherwise dead code from this action's
	// perspective. `subscriberSchema` itself (used by `validateEmail`) is kept real via
	// `importOriginal`, so the email still has to pass validation first.
	it('maps VALIDATION_ERROR to its german message', async () => {
		mockedHeaders.mockResolvedValue(new Headers());
		mock = createFetchMock();
		vi.doMock(import('@/lib/cleverreach'), async (importOriginal) => {
			const actual = await importOriginal<CleverreachModule>();
			return {
				...actual,
				subscribe: vi.fn().mockResolvedValue({
					code: 'VALIDATION_ERROR',
					error: 'Invalid email address',
					success: false,
				}),
			};
		});
		const { subscribeToNewsletter } = await loadWithEnv<SubscribeToNewsletterModule>(
			'@/actions/subscribe-to-newsletter',
			CLEVERREACH_ENV,
		);

		const result = await subscribeToNewsletter(null, emailFormData('person@example.com'));

		expect(result).toStrictEqual({
			error: 'Invalid email address',
			message: 'Bitte überprüfe Deine Eingaben.',
			success: false,
			title: 'Fehler',
		});
		expect(mock.calls).toStrictEqual([]);
	});

	it('falls back to the raw error string for a code with no german mapping', async () => {
		mockedHeaders.mockResolvedValue(new Headers());
		mock = createFetchMock();
		const { subscribeToNewsletter } = await loadWithEnv<SubscribeToNewsletterModule>(
			'@/actions/subscribe-to-newsletter',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueue({
			body: JSON.stringify({ error: { code: 1004, message: 'Custom failure message' } }),
			status: 400,
		});

		const result = await subscribeToNewsletter(null, emailFormData('person@example.com'));

		expect(result).toStrictEqual({
			error: 'Custom failure message',
			message: 'Custom failure message',
			success: false,
			title: 'Fehler',
		});
		expect(mock.unqueued).toStrictEqual([]);
	});
});

describe('completing the subscription', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('returns the success title and message', async () => {
		mockedHeaders.mockResolvedValue(new Headers());
		mock = createFetchMock();
		const { subscribeToNewsletter } = await loadWithEnv<SubscribeToNewsletterModule>(
			'@/actions/subscribe-to-newsletter',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		const result = await subscribeToNewsletter(null, emailFormData('person@example.com'));

		expect(result).toStrictEqual({
			message:
				'Bitte bestätige Deine Anmeldung über den Link in der E-Mail, die wir Dir gesendet haben.',
			success: true,
			title: 'Vielen Dank!',
		});
		expect(mock.unqueued).toStrictEqual([]);
	});
});
