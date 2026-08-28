/**
 * Server-side network mocks for the end-to-end suite.
 *
 * The site renders on the server, so the requests that matter — Sanity queries, the CleverReach
 * newsletter API, Resend, Linear — never reach the browser and cannot be intercepted with
 * Playwright's `page.route`. This file is preloaded into the Next.js process instead
 * (`NODE_OPTIONS='--import ./e2e/mocks/preload.ts'`), before any application code is imported, so
 * MSW is installed on every HTTP client the app happens to use.
 *
 * It is deliberately self-contained: Node runs it directly with its built-in type stripping, and a
 * single file keeps the import graph free of the `.ts` extension specifiers that would need
 * `allowImportingTsExtensions` in the app's tsconfig.
 *
 * Two modes:
 *
 * - default — every Sanity response is served from `e2e/fixtures/`, and an unknown outbound request
 *   fails the run instead of silently reaching the real service.
 * - `E2E_RECORD=1` — Sanity requests go through to the real API and their responses are written to
 *   `e2e/fixtures/` (see `pnpm run e2e:record`).
 *
 * It also pins `Math.random`, which is the second source of non-determinism the pages have.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { HttpResponse, bypass, http, passthrough } from 'msw';
import type { JsonBodyType } from 'msw';
import { setupServer } from 'msw/node';

const HTTP_CONFLICT = 409;
const KEY_LENGTH = 16;
const JSON_INDENT = 2;

/** The one value `Math.random` returns under the mocks. Arbitrary, and never changes. */
const RANDOM_VALUE = 0.42;

const isRecording = process.env.E2E_RECORD === '1';

const fixturesDirectory = path.join(import.meta.dirname, '..', 'fixtures');
const sanityFixturesDirectory = path.join(fixturesDirectory, 'sanity');
const imageStubPath = path.join(fixturesDirectory, 'image-stub.webp');

/** Hosts the app is allowed to reach for real, because nothing about them is under test. */
const PASSTHROUGH_HOSTS = new Set([
	'127.0.0.1',
	'fonts.googleapis.com',
	'fonts.gstatic.com',
	'localhost',
]);

/**
 * The e-mail addresses a spec uses to steer the CleverReach mock into a specific outcome. Every
 * other address subscribes successfully.
 */
const NEWSLETTER_SCENARIOS = {
	ALREADY_SUBSCRIBED: 'bereits-angemeldet@tsg-irlich.test',
	SERVER_ERROR: 'fehler@tsg-irlich.test',
};

/**
 * Query parameters that say how a result is fetched rather than what is fetched. They differ
 * between the two fetchers, and between a build and a request — keying on them would ask for a
 * separate recording of identical content per caller.
 */
const VOLATILE_PARAMS = ['cacheMode', 'perspective', 'returnQuery', 'tag'];

/**
 * Builds the file name a Sanity response is stored under.
 *
 * The GROQ query and its parameters live in the query string, so the path plus the meaningful part
 * of the search identifies a request, while the hash keeps the (very long) result out of the file
 * name.
 *
 * @param url - The requested Sanity URL.
 * @returns The fixture's base name without extension.
 */
function fixtureKey(url: URL): string {
	const params = new URLSearchParams(url.search);

	for (const name of VOLATILE_PARAMS) {
		params.delete(name);
	}

	params.sort();

	return createHash('sha256')
		.update(`${url.pathname}?${params.toString()}`)
		.digest('hex')
		.slice(0, KEY_LENGTH);
}

/**
 * Reads a recorded Sanity response.
 *
 * @param url - The requested Sanity URL.
 * @returns The recorded body, or `undefined` when the request has never been recorded.
 */
function readSanityFixture(url: URL): JsonBodyType | undefined {
	const file = path.join(sanityFixturesDirectory, `${fixtureKey(url)}.json`);

	if (!existsSync(file)) {
		return undefined;
	}

	const recorded: unknown = JSON.parse(readFileSync(file, 'utf8'));

	return (recorded as { body: JsonBodyType }).body;
}

/**
 * Persists a Sanity response so later runs can be served from disk.
 *
 * @param url - The requested Sanity URL.
 * @param body - The response body to store.
 */
function writeSanityFixture(url: URL, body: JsonBodyType): void {
	mkdirSync(sanityFixturesDirectory, { recursive: true });

	const file = path.join(sanityFixturesDirectory, `${fixtureKey(url)}.json`);
	// `url` is kept next to the body purely so a human can tell the fixtures apart.
	const recorded = { body, url: `${url.pathname}${url.search}` };

	writeFileSync(file, `${JSON.stringify(recorded, undefined, JSON_INDENT)}\n`);
}

/**
 * Serves a Sanity query, either from a fixture or — while recording — from the real API.
 *
 * @param request - The intercepted request.
 * @returns The response for the request.
 */
async function handleSanity(request: Request): Promise<Response> {
	const url = new URL(request.url);

	// The Live Content API keeps a stream open for as long as the page lives. An empty, immediately
	// closing stream keeps `<SanityLive />` in the tree without any event ever arriving.
	if (url.pathname.includes('/data/live/events/')) {
		return new HttpResponse('', {
			headers: { 'content-type': 'text/event-stream' },
		});
	}

	if (isRecording) {
		const response = await fetch(bypass(request));
		const body = (await response.json()) as JsonBodyType;

		writeSanityFixture(url, body);

		// The body is handed back re-encoded rather than as the original response: that one still
		// carries its `content-encoding` header while `fetch` has already decompressed the payload,
		// and the Sanity client then fails with "Decompression failed".
		return HttpResponse.json(body);
	}

	const fixture = readSanityFixture(url);

	if (fixture === undefined) {
		throw new Error(
			`No Sanity fixture for ${url.pathname}${url.search}. Run \`pnpm run e2e:record\` to record it.`,
		);
	}

	return HttpResponse.json(fixture);
}

/**
 * Serves every Sanity image through one small stub, so no test depends on the bytes of a real asset.
 *
 * @returns The stub image response.
 */
function handleSanityImage(): Response {
	return new HttpResponse(new Uint8Array(readFileSync(imageStubPath)), {
		headers: { 'content-type': 'image/webp' },
	});
}

/**
 * Answers the three CleverReach calls the newsletter subscription makes.
 *
 * @param request - The intercepted request.
 * @returns The response for the request.
 */
async function handleCleverReach(request: Request): Promise<Response> {
	const url = new URL(request.url);

	if (url.pathname === '/oauth/token.php') {
		return HttpResponse.json({ access_token: 'e2e-token', expires_in: 3600 });
	}

	if (url.pathname.includes('/receivers')) {
		const payload: unknown = await request.clone().json();
		const { email } = payload as { email?: string };

		if (email === NEWSLETTER_SCENARIOS.ALREADY_SUBSCRIBED) {
			return HttpResponse.json(
				{ error: { code: 409, message: 'duplicate' } },
				{
					status: HTTP_CONFLICT,
				},
			);
		}

		if (email === NEWSLETTER_SCENARIOS.SERVER_ERROR) {
			return HttpResponse.json({ error: { code: 500, message: 'boom' } }, { status: 500 });
		}

		return HttpResponse.json({ email, id: 'e2e-receiver' });
	}

	return HttpResponse.json({ success: true });
}

const handlers = [
	http.all('*', async ({ request }) => {
		const url = new URL(request.url);
		const { hostname } = url;

		if (PASSTHROUGH_HOSTS.has(hostname)) {
			return passthrough();
		}

		if (hostname === 'cdn.sanity.io') {
			return handleSanityImage();
		}

		if (hostname.endsWith('sanity.io')) {
			return handleSanity(request);
		}

		if (hostname === 'rest.cleverreach.com') {
			return handleCleverReach(request);
		}

		if (hostname === 'api.resend.com') {
			return HttpResponse.json({ id: 'e2e-email' });
		}

		if (hostname === 'api.linear.app') {
			return HttpResponse.json({
				data: { issueCreate: { issue: { id: 'e2e-issue', identifier: 'WEB-000' }, success: true } },
			});
		}

		throw new Error(
			`Unmocked outbound request in the e2e run: ${request.method} ${url.href}. Add a handler in e2e/mocks/preload.ts.`,
		);
	}),
];

/**
 * Pins `Math.random` to a single value.
 *
 * The home page picks three of its testimonials at random on every render, which makes its markup —
 * and with it its screenshot — different every time. A seeded sequence is not enough: it fixes the
 * order of the values but not the position the shuffle draws from, and how many other calls come
 * first depends on how the build parallelized. A constant removes the position from the equation, so
 * the Fisher-Yates pass in `shuffleArray` produces the same permutation everywhere.
 *
 * @returns Nothing.
 */
function freezeRandom(): void {
	Math.random = () => RANDOM_VALUE;
}

freezeRandom();

const server = setupServer(...handlers);

server.listen({ onUnhandledRequest: 'error' });

process.once('exit', () => {
	server.close();
});
