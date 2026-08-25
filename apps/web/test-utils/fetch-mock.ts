import { vi } from 'vitest';

interface FetchCall {
	body: string | undefined;
	headers: Record<string, string>;
	method: string;
	url: string;
}

interface MockResponse {
	body: string;
	status: number;
}

/**
 * Resolves the URL a `fetch` call targets, regardless of which `RequestInfo` shape it was called
 * with. `String(input)` is not safe for this: a `Request` has no custom `toString`, so it would
 * stringify to `[object Request]`.
 *
 * @param input - The first argument a `fetch` call was made with.
 * @returns The URL the call targets, as a string.
 */
function resolveUrl(input: RequestInfo | URL): string {
	if (typeof input === 'string') {
		return input;
	}
	if (input instanceof URL) {
		return input.toString();
	}
	return input.url;
}

/**
 * Replaces the global `fetch` with a queue of canned responses and records every request.
 *
 * Responses are handed out in the order they were enqueued, which keeps the tests of the multi
 * request flows (token, then receiver, then DOI mail) readable.
 *
 * Recorded `headers` are normalized through the `Headers` constructor, same as the real `fetch`
 * does, which lowercases every header name — assert against lowercase keys (`authorization`,
 * `content-type`), not the casing the code under test sent them with.
 *
 * @returns The recorded calls plus controls to enqueue responses and restore the real `fetch`.
 */
function createFetchMock(): {
	calls: FetchCall[];
	enqueue: (response: MockResponse) => void;
	enqueueJson: (body: unknown, init?: { status?: number }) => void;
	restore: () => void;
} {
	const calls: FetchCall[] = [];
	const queue: MockResponse[] = [];

	const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = resolveUrl(input);

		calls.push({
			body: typeof init?.body === 'string' ? init.body : undefined,
			headers: Object.fromEntries(new Headers(init?.headers).entries()),
			method: init?.method ?? 'GET',
			url,
		});

		const next = queue.shift();

		if (!next) {
			throw new Error(`No mock response queued for ${url}`);
		}

		// Mirrors the real `fetch`, which hands back the response on a later microtask.
		await Promise.resolve();
		return new Response(next.body, { status: next.status });
	});

	vi.stubGlobal('fetch', fetchMock);

	return {
		calls,
		enqueue: (response: MockResponse) => {
			queue.push(response);
		},
		enqueueJson: (body: unknown, init?: { status?: number }) => {
			queue.push({ body: JSON.stringify(body), status: init?.status ?? 200 });
		},
		restore: () => {
			vi.unstubAllGlobals();
		},
	};
}

export { createFetchMock, type FetchCall, type MockResponse };
