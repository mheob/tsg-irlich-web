import { vi } from 'vitest';

interface FetchCall {
	/**
	 * The call's `body` as text — populated for a `string` body (e.g. a `JSON.stringify(...)`
	 * payload) and a `URLSearchParams` body; `undefined` for every other body type, including when
	 * `bodyBytes` is populated. See `resolveBody` for the full mapping.
	 */
	body: string | undefined;
	/**
	 * The call's `body` as raw bytes — populated for an `ArrayBuffer` or `ArrayBufferView` body
	 * (e.g. a file upload); `undefined` for every other body type, including when `body` is
	 * populated. See `resolveBody` for the full mapping.
	 */
	bodyBytes: Uint8Array | undefined;
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
 * Splits a `fetch` call's `body` init option into a text form and a binary form, mirroring how
 * `Request` itself would serialize it.
 *
 * A plain `string` body (the common case — a `JSON.stringify(...)` payload) is recorded as-is. A
 * `URLSearchParams` body (used for `application/x-www-form-urlencoded` requests) is text too, so
 * it is recorded through `String(...)`, which serializes it the same way `fetch` would put it on
 * the wire. An `ArrayBuffer` or `ArrayBufferView` body (used for binary uploads, for example a
 * file's raw bytes) is recorded as a `Uint8Array` in `bodyBytes` instead, with `body` left
 * `undefined`. Any other body type — a `Blob`, a `FormData`, a `ReadableStream` — leaves both
 * `body` and `bodyBytes` `undefined`; extend this function if a test needs to see through one of
 * those.
 *
 * @param body - The `body` init option a `fetch` call was made with.
 * @returns The text and binary forms of the body, whichever one applies.
 */
function resolveBody(body: BodyInit | null | undefined): {
	body: string | undefined;
	bodyBytes: Uint8Array | undefined;
} {
	if (typeof body === 'string') {
		return { body, bodyBytes: undefined };
	}
	if (body instanceof URLSearchParams) {
		return { body: String(body), bodyBytes: undefined };
	}
	if (body instanceof ArrayBuffer) {
		return { body: undefined, bodyBytes: new Uint8Array(body) };
	}
	if (ArrayBuffer.isView(body)) {
		return {
			body: undefined,
			bodyBytes: new Uint8Array(body.buffer, body.byteOffset, body.byteLength),
		};
	}
	return { body: undefined, bodyBytes: undefined };
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
 * Recorded `body`/`bodyBytes` split text bodies from binary ones — see `resolveBody`'s doc comment
 * for exactly which body types land in which field, and which are not captured at all.
 *
 * A request made once the queue is empty still throws, so a missing `enqueue` fails fast when
 * nothing under test swallows the error. It is also recorded on `unqueued` before the throw, so a
 * test whose subject catches its own errors (for example a `try`/`catch` that returns an error
 * result) can tell a short queue apart from a genuine failure by asserting
 * `expect(mock.unqueued).toEqual([])`.
 *
 * @returns The recorded calls, the calls that ran out of queued responses, plus controls to
 * enqueue responses and restore the real `fetch`.
 */
function createFetchMock(): {
	calls: FetchCall[];
	enqueue: (response: MockResponse) => void;
	enqueueJson: (body: unknown, init?: { status?: number }) => void;
	restore: () => void;
	unqueued: FetchCall[];
} {
	const calls: FetchCall[] = [];
	const unqueued: FetchCall[] = [];
	const queue: MockResponse[] = [];

	const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = resolveUrl(input);

		const call = {
			...resolveBody(init?.body),
			headers: Object.fromEntries(new Headers(init?.headers).entries()),
			method: init?.method ?? 'GET',
			url,
		};

		calls.push(call);

		const next = queue.shift();

		if (!next) {
			unqueued.push(call);
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
		unqueued,
	};
}

export { createFetchMock, type FetchCall, type MockResponse };
