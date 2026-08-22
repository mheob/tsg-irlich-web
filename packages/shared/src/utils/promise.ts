/**
 * The outcome of an awaited promise: either the value it resolved with, or the reason it rejected
 * with.
 */
export type Settled<T> = { ok: true; value: T } | { error: unknown; ok: false };

/**
 * Awaits a promise and reports how it ended instead of throwing. Lets callers branch on failure
 * without a `try`/`catch`/`finally` block, which the React Compiler cannot optimize.
 *
 * @param promise - The promise to await.
 * @returns The resolved value or the rejection reason, tagged with `ok`.
 * @example
 * const outcome = await settle(sendContactForm(values));
 * if (!outcome.ok) {
 * 	// handle the rejection
 * }
 */
export function settle<T>(promise: PromiseLike<T>): Promise<Settled<T>> {
	return Promise.resolve(promise).then(
		(value) => ({ ok: true, value }) as const,
		(error: unknown) => ({ error, ok: false }) as const,
	);
}
