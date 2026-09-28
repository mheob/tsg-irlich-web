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
import { crc32, deflateSync } from 'node:zlib';

import { HttpResponse, bypass, http, passthrough } from 'msw';
import type { JsonBodyType } from 'msw';
import { setupServer } from 'msw/node';

const HTTP_CONFLICT = 409;
const KEY_LENGTH = 16;
const JSON_INDENT = 2;

/** The one value `Math.random` returns under the mocks. Arbitrary, and never changes. */
const RANDOM_VALUE = 0.42;

const isRecording = process.env.E2E_RECORD === '1';

const sanityFixturesDirectory = path.join(import.meta.dirname, '..', 'fixtures', 'sanity');

/** `rect=<left>,<top>,<width>,<height>`: the size starts at the third value. */
const RECT_SIZE_OFFSET = 2;

/** The longest edge a stub image gets, so the image optimizer has next to nothing to encode. */
const MAX_STUB_EDGE = 256;

/**
 * `\x89PNG\r\n\x1A\n`. Written in decimal because the formatter lowercases hex digits and the linter
 * asks for uppercase ones.
 */
const PNG_SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
const PNG_BIT_DEPTH = 8;
/** Greyscale with alpha: two zero bytes per pixel make it fully transparent. */
const PNG_GREY_ALPHA = 4;
const PNG_BYTES_PER_PIXEL = 2;
const PNG_HEADER_LENGTH = 13;
/** Length, type and checksum around a chunk's data. */
const PNG_CHUNK_OVERHEAD = 12;
const PNG_TYPE_OFFSET = 4;
const PNG_DATA_OFFSET = 8;

/** The stub images generated so far, keyed by `<width>x<height>`. */
const stubImages = new Map<string, Uint8Array>();

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

interface ImageSize {
	height: number;
	width: number;
}

/**
 * Works out the proportions the Sanity CDN delivers for an image URL.
 *
 * `fit=crop` with a width and a height — what `urlForImage` asks for when it gets a height —
 * returns exactly that box. Every other request keeps the proportions of its source: the `rect`
 * crop when one is set, the original otherwise, whose dimensions are part of the asset's file name.
 *
 * @param url - The requested image URL.
 * @returns The size of the image the CDN would answer with, or one of the same proportions.
 */
function sanityImageSize(url: URL): ImageSize {
	const { searchParams } = url;
	const width = Number(searchParams.get('w'));
	const height = Number(searchParams.get('h'));

	if (searchParams.get('fit') === 'crop' && width > 0 && height > 0) {
		return { height, width };
	}

	const rect = (searchParams.get('rect') ?? '').split(',').map(Number);
	const [rectWidth, rectHeight] = rect.slice(RECT_SIZE_OFFSET);

	if (rectWidth && rectHeight) {
		return { height: rectHeight, width: rectWidth };
	}

	// A Sanity asset's file name ends in its dimensions: `<hash>-<width>x<height>.<format>`.
	const { pathname } = url;
	const [assetWidth, assetHeight] = pathname
		.slice(pathname.lastIndexOf('-') + 1, pathname.lastIndexOf('.'))
		.split('x')
		.map(Number);

	return { height: assetHeight || 1, width: assetWidth || 1 };
}

/**
 * Finds the smallest size with the same proportions, so a stub stays a few bytes: 420 × 120 becomes
 * 7 × 2. Proportions that do not reduce that far are matched by the closest fraction with both sides
 * at most {@link MAX_STUB_EDGE} long — 5120 × 3413 becomes 3 × 2. For every asset in the fixtures
 * that is off by less than a pixel, even at the 2560 px the lightbox asks for.
 *
 * @param size - The size to shrink.
 * @returns The shrunk size.
 */
function reduceImageSize(size: ImageSize): ImageSize {
	const ratio = size.width / size.height;
	let closest: ImageSize = { height: 1, width: 1 };
	let closestError = Number.POSITIVE_INFINITY;

	for (let height = 1; height <= MAX_STUB_EDGE; height += 1) {
		const width = Math.min(MAX_STUB_EDGE, Math.max(1, Math.round(height * ratio)));
		const error = Math.abs(width / height - ratio);

		// Strictly smaller, so an exact match keeps the smallest size it was first found at.
		if (error < closestError) {
			closest = { height, width };
			closestError = error;
		}
	}

	return closest;
}

/**
 * Wraps data in a PNG chunk: its length, its type, the data and a checksum over type and data.
 *
 * @param type - The four-letter chunk type.
 * @param data - The chunk's data.
 * @returns The encoded chunk.
 */
function pngChunk(type: string, data: Uint8Array): Buffer {
	const chunk = Buffer.alloc(data.length + PNG_CHUNK_OVERHEAD);

	chunk.writeUInt32BE(data.length, 0);
	chunk.write(type, PNG_TYPE_OFFSET, 'ascii');
	chunk.set(data, PNG_DATA_OFFSET);
	chunk.writeUInt32BE(
		crc32(chunk.subarray(PNG_TYPE_OFFSET, PNG_DATA_OFFSET + data.length)),
		PNG_DATA_OFFSET + data.length,
	);

	return chunk;
}

/**
 * Encodes a fully transparent PNG. Every scanline is a filter byte of 0 followed by transparent
 * pixels, so the whole image is zeros and compresses to next to nothing.
 *
 * @param size - The size of the image.
 * @returns The encoded PNG.
 */
function transparentPng(size: ImageSize): Uint8Array {
	const { height, width } = size;
	const header = Buffer.alloc(PNG_HEADER_LENGTH);

	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, PNG_TYPE_OFFSET);
	header.writeUInt8(PNG_BIT_DEPTH, PNG_DATA_OFFSET);
	header.writeUInt8(PNG_GREY_ALPHA, PNG_DATA_OFFSET + 1);

	const pixels = deflateSync(Buffer.alloc((1 + width * PNG_BYTES_PER_PIXEL) * height));
	const chunks = [
		pngChunk('IHDR', header),
		pngChunk('IDAT', pixels),
		pngChunk('IEND', new Uint8Array()),
	];

	return new Uint8Array(Buffer.concat([PNG_SIGNATURE, ...chunks]));
}

/**
 * Serves every Sanity image as a transparent stub, so no test depends on the bytes of a real asset.
 *
 * The stub has the proportions the real CDN would deliver for the URL. A browser reserves the box
 * from `width` and `height` until an image has loaded, and then switches to the image's own
 * proportions: a stub of any other shape resizes the image once it arrives, and everything below it
 * moves. WebKit has no scroll anchoring to hide that, so a click aimed at the footer missed.
 *
 * @param request - The intercepted request.
 * @returns The stub image response.
 */
function handleSanityImage(request: Request): Response {
	const size = reduceImageSize(sanityImageSize(new URL(request.url)));
	const key = `${size.width}x${size.height}`;
	let image = stubImages.get(key);

	if (image === undefined) {
		image = transparentPng(size);
		stubImages.set(key, image);
	}

	return new HttpResponse(image, { headers: { 'content-type': 'image/png' } });
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
			return handleSanityImage(request);
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
