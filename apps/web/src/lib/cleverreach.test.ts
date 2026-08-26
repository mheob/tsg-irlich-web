import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as cleverreachModule from '@/lib/cleverreach';

import { loadWithEnv } from '../../test-utils/env';
import { createFetchMock } from '../../test-utils/fetch-mock';

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
