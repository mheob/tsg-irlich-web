import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as cleverreachModule from '@/lib/cleverreach';

import { loadWithEnv } from '../../test-utils/env';
import { createFetchMock, type FetchCall } from '../../test-utils/fetch-mock';

type CleverreachModule = typeof cleverreachModule;

const CLEVERREACH_ENV = {
	CLEVERREACH_CLIENT_ID: 'test-client-id',
	CLEVERREACH_CLIENT_SECRET: 'test-client-secret',
	CLEVERREACH_FORM_ID: 'test-form-id',
	CLEVERREACH_LIST_ID: 'test-list-id',
};

const SUBSCRIBER_INPUT = { email: 'person@example.com' };

// `cleverreach.ts` computes `FIVE_MINUTES` as `timeSpanInMilliSeconds('minute') * 5`. Read from
// `packages/shared/src/utils/date.ts`, `timeSpanInMilliSeconds('minute')` is `60_000`, so the
// buffer is `300_000` ms. Hard-coded here rather than imported, per the "never build an expected
// value from a constant the implementation also imports" rule.
const FIVE_MINUTE_BUFFER_MS = 300_000;

// `subscriberSchema.safeParse` (zod 4) formats a failed `z.email()` check as this JSON array —
// built here from a hard-coded object rather than by importing `subscriberSchema` and parsing
// with it, per the "never derive an expected value from a constant the implementation also
// imports" rule. Key order matters: it must match zod's own issue shape (origin, code, format,
// pattern, path, message) since this is compared as a raw string, not a parsed object.
const EXPECTED_VALIDATION_ERROR_MESSAGE = JSON.stringify(
	[
		{
			origin: 'string',
			code: 'invalid_format',
			format: 'email',
			pattern:
				"/^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$/",
			path: ['email'],
			message: 'Invalid email address',
		},
	],
	null,
	2,
);

/**
 * Parses a recorded fetch call's JSON body. Kept as a top-level helper (rather than an inline
 * `call.body ?? ''` in each assertion) so no test body contains a conditional — the oxlint
 * `vitest/no-conditional-in-test` rule flags `??`/`?.` inside `it(...)` callbacks.
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

describe('requesting the cleverreach access token', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('requests the token first, with client credentials in a form-encoded body', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		await subscribe(SUBSCRIBER_INPUT);

		const tokenCall = mock.calls[0];

		expect(tokenCall.url).toBe('https://rest.cleverreach.com/oauth/token.php');
		expect(tokenCall.method).toBe('POST');
		expect(tokenCall.headers['content-type']).toBe('application/x-www-form-urlencoded');
		// `tokenCall.body` is the `URLSearchParams`, serialized to text by the fetch mock (see
		// `resolveBody` in `apps/web/test-utils/fetch-mock.ts`); parse it back to assert every field
		// in one call rather than three separate `toContain` checks.
		expect(Object.fromEntries(new URLSearchParams(tokenCall.body))).toStrictEqual({
			client_id: 'test-client-id',
			client_secret: 'test-client-secret',
			grant_type: 'client_credentials',
		});
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('reuses a cached token across a second subscribe call', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});
		mock.enqueueJson({});
		mock.enqueueJson({});

		await subscribe(SUBSCRIBER_INPUT);
		await subscribe(SUBSCRIBER_INPUT);

		const tokenCalls = mock.calls.filter((call) => call.url.endsWith('oauth/token.php'));

		expect(tokenCalls).toHaveLength(1);
		expect(mock.calls).toHaveLength(5);
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('refetches the token once it is within the five-minute expiry buffer', async () => {
		vi.useFakeTimers();
		const start = new Date('2026-01-01T00:00:00.000Z');
		vi.setSystemTime(start);

		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-1', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});
		await subscribe(SUBSCRIBER_INPUT);

		// expires_in (3600s = 3_600_000ms) minus the five-minute buffer leaves the token valid for
		// 3_300_000ms; advance one millisecond past that so the cache is no longer considered fresh.
		vi.setSystemTime(new Date(start.getTime() + 3_600_000 - FIVE_MINUTE_BUFFER_MS + 1));

		mock.enqueueJson({ access_token: 'token-2', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});
		await subscribe(SUBSCRIBER_INPUT);

		const tokenCalls = mock.calls.filter((call) => call.url.endsWith('oauth/token.php'));

		expect(tokenCalls).toHaveLength(2);
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('returns INTERNAL_ERROR and logs the failure when the token response is not ok', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueue({ body: 'invalid_client', status: 401 });

		const result = await subscribe(SUBSCRIBER_INPUT);

		expect(result.success).toBe(false);
		expect(result).toMatchObject({
			code: 'INTERNAL_ERROR',
			error: 'An unexpected error occurred. Please try again later.',
		});
		expect(errorSpy).toHaveBeenCalledWith(
			'CleverReach subscription error:',
			expect.objectContaining({
				message: 'CleverReach authentication failed: invalid_client',
			}),
		);
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('returns INTERNAL_ERROR when the token payload fails accessTokenSchema', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		// expires_in must be a number; a string fails accessTokenSchema's parse.
		mock.enqueueJson({ access_token: 'token-abc', expires_in: '3600' });

		const result = await subscribe(SUBSCRIBER_INPUT);

		expect(result.success).toBe(false);
		expect(result).toMatchObject({
			code: 'INTERNAL_ERROR',
			error: 'An unexpected error occurred. Please try again later.',
		});
		expect(errorSpy).toHaveBeenCalledWith('CleverReach subscription error:', expect.anything());
		expect(mock.unqueued).toStrictEqual([]);
	});
});

describe('adding a subscriber to the list', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('adds the receiver with a bearer token and a registered timestamp', async () => {
		vi.useFakeTimers();
		const now = new Date('2026-03-01T12:00:00.000Z');
		vi.setSystemTime(now);

		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		await subscribe(SUBSCRIBER_INPUT);

		const receiverCall = mock.calls[1];

		expect({
			authorization: receiverCall.headers.authorization,
			contentType: receiverCall.headers['content-type'],
			method: receiverCall.method,
			url: receiverCall.url,
		}).toStrictEqual({
			authorization: 'Bearer token-abc',
			contentType: 'application/json',
			method: 'POST',
			url: 'https://rest.cleverreach.com/v3/groups.json/test-list-id/receivers',
		});
		expect(parseJsonBody(receiverCall)).toStrictEqual({
			activated: 0,
			email: 'person@example.com',
			registered: Math.floor(now.getTime() / 1000),
			source: 'Next.js Website',
		});
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('returns ALREADY_SUBSCRIBED on a 409 without sending the DOI mail', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueue({ body: JSON.stringify({}), status: 409 });

		const result = await subscribe(SUBSCRIBER_INPUT);

		expect(result).toStrictEqual({
			code: 'ALREADY_SUBSCRIBED',
			error: 'This email is already subscribed',
			success: false,
		});
		expect(mock.calls).toHaveLength(2);
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('passes through the error code and message from the API response body', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueue({
			body: JSON.stringify({ error: { code: 1004, message: 'Custom failure message' } }),
			status: 400,
		});

		const result = await subscribe(SUBSCRIBER_INPUT);

		expect(result).toStrictEqual({
			code: '1004',
			error: 'Custom failure message',
			success: false,
		});
		expect(mock.calls).toHaveLength(2);
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('falls back to the default error message when the error body is not JSON', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueue({ body: 'not json', status: 500 });

		const result = await subscribe(SUBSCRIBER_INPUT);

		expect(result).toStrictEqual({
			code: undefined,
			error: 'Failed to add subscriber',
			success: false,
		});
		expect(mock.calls).toHaveLength(2);
		expect(mock.unqueued).toStrictEqual([]);
	});
});

describe('sending the double opt-in email', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('sends the DOI mail with the group id and the provided metadata', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		await subscribe(SUBSCRIBER_INPUT, {
			referer: 'https://example.com/newsletter',
			userAgent: 'TestAgent/1.0',
			userIp: '203.0.113.5',
		});

		const doiCall = mock.calls[2];

		expect({
			authorization: doiCall.headers.authorization,
			contentType: doiCall.headers['content-type'],
			method: doiCall.method,
			url: doiCall.url,
		}).toStrictEqual({
			authorization: 'Bearer token-abc',
			contentType: 'application/json',
			method: 'POST',
			url: 'https://rest.cleverreach.com/v3/forms.json/test-form-id/send/activate',
		});
		expect(parseJsonBody(doiCall)).toStrictEqual({
			doidata: {
				referer: 'https://example.com/newsletter',
				user_agent: 'TestAgent/1.0',
				user_ip: '203.0.113.5',
			},
			email: 'person@example.com',
			groups_ids: ['test-list-id'],
		});
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('keeps the subscription successful and logs when the DOI mail fails to send', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueue({ body: 'DOI backend unavailable', status: 502 });

		const result = await subscribe(SUBSCRIBER_INPUT);

		expect(result).toStrictEqual({
			message: 'Please check your email to confirm your subscription',
			success: true,
		});
		expect(errorSpy).toHaveBeenCalledWith(
			'Failed to send DOI email, but receiver was added:',
			'DOI backend unavailable',
		);
		expect(mock.unqueued).toStrictEqual([]);
	});
});

describe('resolving the double opt-in metadata', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('uses explicit metadata over every default', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>('@/lib/cleverreach', {
			...CLEVERREACH_ENV,
			VERCEL_PROJECT_PRODUCTION_URL: 'tsg-irlich.vercel.app',
		});

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		await subscribe(SUBSCRIBER_INPUT, {
			referer: 'https://custom.example/referrer',
			userAgent: 'CustomAgent/9.0',
			userIp: '198.51.100.7',
		});

		expect(parseJsonBody(mock.calls[2])).toStrictEqual({
			doidata: {
				referer: 'https://custom.example/referrer',
				user_agent: 'CustomAgent/9.0',
				user_ip: '198.51.100.7',
			},
			email: 'person@example.com',
			groups_ids: ['test-list-id'],
		});
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('derives the referer from VERCEL_PROJECT_PRODUCTION_URL and falls back for agent and ip', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>('@/lib/cleverreach', {
			...CLEVERREACH_ENV,
			VERCEL_PROJECT_PRODUCTION_URL: 'tsg-irlich.vercel.app',
		});

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		await subscribe(SUBSCRIBER_INPUT);

		expect(parseJsonBody(mock.calls[2])).toStrictEqual({
			doidata: {
				referer: 'https://tsg-irlich.vercel.app',
				user_agent: 'Mozilla/5.0',
				user_ip: '0.0.0.0',
			},
			email: 'person@example.com',
			groups_ids: ['test-list-id'],
		});
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('leaves the referer empty when VERCEL_PROJECT_PRODUCTION_URL is unset', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>('@/lib/cleverreach', {
			...CLEVERREACH_ENV,
			VERCEL_PROJECT_PRODUCTION_URL: undefined,
		});

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		await subscribe(SUBSCRIBER_INPUT);

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

describe('validating and completing a subscription', () => {
	let mock: ReturnType<typeof createFetchMock> | undefined;

	afterEach(() => {
		mock?.restore();
		vi.restoreAllMocks();
	});

	it('returns VALIDATION_ERROR for an invalid email without making any request', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		const result = await subscribe({ email: 'not-an-email' });

		expect(result).toStrictEqual({
			code: 'VALIDATION_ERROR',
			error: EXPECTED_VALIDATION_ERROR_MESSAGE,
			success: false,
		});
		expect(mock.calls).toStrictEqual([]);
		expect(mock.unqueued).toStrictEqual([]);
	});

	it('returns INTERNAL_ERROR when a request fails unexpectedly partway through the flow', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		// Only the token response is queued: the addReceiver call runs out of queue and the mock
		// itself throws, exercising subscribe's own try/catch rather than a modeled API error. This
		// is the one case in the file where a short queue is the point of the test, not a mistake —
		// see the `unqueued` assertion below instead of the usual `toStrictEqual([])`.
		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });

		const result = await subscribe(SUBSCRIBER_INPUT);

		expect(result).toStrictEqual({
			code: 'INTERNAL_ERROR',
			error: 'An unexpected error occurred. Please try again later.',
			success: false,
		});
		expect(errorSpy).toHaveBeenCalledWith(
			'CleverReach subscription error:',
			expect.objectContaining({
				message:
					'No mock response queued for https://rest.cleverreach.com/v3/groups.json/test-list-id/receivers',
			}),
		);
		expect(mock.unqueued).toHaveLength(1);
	});

	it('completes the subscription and hits the token, receiver and DOI endpoints in order', async () => {
		mock = createFetchMock();
		const { subscribe } = await loadWithEnv<CleverreachModule>(
			'@/lib/cleverreach',
			CLEVERREACH_ENV,
		);

		mock.enqueueJson({ access_token: 'token-abc', expires_in: 3600 });
		mock.enqueueJson({});
		mock.enqueueJson({});

		const result = await subscribe(SUBSCRIBER_INPUT);

		expect(result).toStrictEqual({
			message: 'Please check your email to confirm your subscription',
			success: true,
		});
		expect(mock.calls.map((call) => call.url)).toStrictEqual([
			'https://rest.cleverreach.com/oauth/token.php',
			'https://rest.cleverreach.com/v3/groups.json/test-list-id/receivers',
			'https://rest.cleverreach.com/v3/forms.json/test-form-id/send/activate',
		]);
		expect(mock.unqueued).toStrictEqual([]);
	});
});
