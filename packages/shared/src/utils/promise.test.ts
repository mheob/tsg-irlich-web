import { describe, expect, it } from 'vitest';

import { settle } from './promise';

describe('settling a promise', () => {
	it('reports a resolved value', async () => {
		const outcome = await settle(Promise.resolve('hello'));
		expect(outcome).toStrictEqual({ ok: true, value: 'hello' });
	});

	it('reports a rejection with the original error identity', async () => {
		const error = new Error('boom');
		const outcome = await settle(Promise.reject(error));
		expect(outcome.ok).toBe(false);
		const failure = outcome as { error: unknown; ok: false };
		expect(failure.error).toBe(error);
	});

	it('resolves a plain thenable', async () => {
		const thenable = {
			// oxlint-disable-next-line unicorn/no-thenable -- deliberately a thenable, not a real Promise
			then(onFulfilled: (value: string) => void) {
				onFulfilled('thenable-value');
			},
		} as unknown as PromiseLike<string>;
		const outcome = await settle(thenable);
		expect(outcome).toStrictEqual({ ok: true, value: 'thenable-value' });
	});

	it('resolves a non-promise value passed through Promise.resolve', async () => {
		// `settle` wraps its argument with `Promise.resolve`, so even a value that is not
		// actually a promise (bypassing the `PromiseLike<T>` parameter type here) settles.
		const outcome = await settle(42 as unknown as PromiseLike<number>);
		expect(outcome).toStrictEqual({ ok: true, value: 42 });
	});

	it('preserves a non-Error rejection reason as-is', async () => {
		const reason = 'plain string failure';
		// oxlint-disable-next-line typescript/prefer-promise-reject-errors prefer-promise-reject-errors -- deliberately a non-Error rejection reason
		const rejectedPromise = Promise.reject(reason);
		const outcome = await settle(rejectedPromise);
		expect(outcome).toStrictEqual({ error: reason, ok: false });
	});

	it('never rejects the promise it returns', async () => {
		const rejectedPromise = Promise.reject(new Error('x'));
		await expect(settle(rejectedPromise)).resolves.toMatchObject({ ok: false });
	});
});
