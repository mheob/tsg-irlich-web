// @vitest-environment node
import { randomUUID } from 'node:crypto';

import { describe, expect, it, vi } from 'vite-plus/test';

import { buildIntroRequest, checkIntroAccess, draftIntro } from './intro';
import type { IntroInput } from './intro';

// Made up per run, so no key-shaped literal sits in the repository.
const API_KEY = randomUUID();

// The JPEG start and end markers, FF D8 and FF D9, in decimal: the formatter lowercases hex digits and the linter wants them uppercase.
const JPEG = new Uint8Array([255, 216, 255, 217]);
const INPUT: IntroInput = {
	images: [JPEG, JPEG, JPEG, JPEG],
	text: '--- Seite 1 ---\nJahreshauptversammlung',
	title: 'TSG ECHO 2010 Nr. 2',
	year: '2010',
};

/**
 * A fetch that answers once with the given status and body.
 *
 * @param status - The HTTP status.
 * @param body - The JSON body.
 * @returns The spy.
 */
function answer(status: number, body: unknown) {
	return vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(body, { status }));
}

const DONE = { content: [{ text: 'Ein Intro.', type: 'text' }], stop_reason: 'end_turn' };
const wait = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue();

describe('the intro request', () => {
	it('shows the model the cover and the next two pages as jpeg images', () => {
		const [message] = buildIntroRequest(INPUT).messages;
		const images = message.content.filter((block) => block.type === 'image');

		expect(images).toHaveLength(3);
		expect(images[0]).toStrictEqual({
			source: { data: '/9j/2Q==', media_type: 'image/jpeg', type: 'base64' },
			type: 'image',
		});
	});

	it('asks for the issue by title and year, with the text layer as context', () => {
		const [message] = buildIntroRequest(INPUT).messages;

		expect(message.content.at(-1)).toStrictEqual({
			text: 'Schreibe das Intro für „TSG ECHO 2010 Nr. 2“ (2010).\n\nTextebene der Ausgabe (Auszug):\n--- Seite 1 ---\nJahreshauptversammlung',
			type: 'text',
		});
	});

	it('uses the configured model and forbids names and contact data', () => {
		const request = buildIntroRequest(INPUT);

		expect(request).toMatchObject({ max_tokens: 2000, model: 'claude-sonnet-5-5' });
		expect(request.system).toContain('Nenne keine Namen von Personen');
		expect(request.system).toContain('Telefonnummern');
	});

	it('cuts the text layer after 6000 characters', () => {
		const [message] = buildIntroRequest({ ...INPUT, text: 'x'.repeat(7000) }).messages;

		expect(message.content.at(-1)).toStrictEqual({
			text: `Schreibe das Intro für „TSG ECHO 2010 Nr. 2“ (2010).\n\nTextebene der Ausgabe (Auszug):\n${'x'.repeat(6000)}`,
			type: 'text',
		});
	});

	// Review focus 5: a scan has no text layer.
	it('tells the model to read the pages of a scan', () => {
		const [message] = buildIntroRequest({ ...INPUT, text: '' }).messages;

		expect(message.content.at(-1)).toStrictEqual({
			text: 'Schreibe das Intro für „TSG ECHO 2010 Nr. 2“ (2010). Die Ausgabe ist ein Scan ohne Textebene, lies die Seitenbilder.',
			type: 'text',
		});
	});

	// Review focus 5: the API takes at most 5 MB per image in base64.
	it('leaves out a page image above the size limit', () => {
		const huge = new Uint8Array(3_750_001);
		const [message] = buildIntroRequest({ ...INPUT, images: [huge, JPEG] }).messages;

		expect(message.content.filter((block) => block.type === 'image')).toHaveLength(1);
	});

	it('refuses an issue with neither images nor text', () => {
		expect(() => buildIntroRequest({ ...INPUT, images: [], text: '' })).toThrow(
			'Für das Intro fehlen Seitenbilder und Text.',
		);
	});
});

describe('drafting an intro', () => {
	it('posts the request with the key and api version and returns the trimmed text', async () => {
		const fetch = answer(200, {
			content: [{ text: ' Ein Intro. ', type: 'text' }],
			stop_reason: 'end_turn',
		});

		await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch, wait })).resolves.toBe('Ein Intro.');
		expect(fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', {
			body: JSON.stringify(buildIntroRequest(INPUT)),
			headers: {
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json',
				'x-api-key': API_KEY,
			},
			method: 'POST',
		});
	});

	it('names the status of a failed request', async () => {
		const fetch = answer(401, { error: { type: 'authentication_error' } });

		await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch, wait })).rejects.toThrow(
			'Die Anthropic-API antwortete mit 401.',
		);
	});

	it('refuses an answer without text', async () => {
		const fetch = answer(200, { content: [{ text: '  ', type: 'text' }], stop_reason: 'end_turn' });

		await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch, wait })).rejects.toThrow(
			'Die Anthropic-API lieferte kein Intro.',
		);
	});

	// Final review I1: a cut-off sentence must never reach the editors as a finished draft.
	it.each(['max_tokens', 'refusal'])(
		'refuses an answer that stopped with %s',
		async (stopReason) => {
			const fetch = answer(200, {
				content: [{ text: 'Die Ausgabe berichtet über', type: 'text' }],
				stop_reason: stopReason,
			});

			await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch, wait })).rejects.toThrow(
				`Die Anthropic-API brach das Intro ab (${stopReason}).`,
			);
		},
	);
});

// Final review I2: a busy API must not cost an intro, and a bad key must stop the run.
describe('retrying a busy api', () => {
	it.each([429, 500, 503, 529])('tries again after a %i', async (status) => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(Response.json({}, { status }))
			.mockResolvedValue(Response.json(DONE));
		wait.mockClear();

		await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch, wait })).resolves.toBe('Ein Intro.');
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(wait).toHaveBeenCalledWith(1000);
	});

	it('waits as long as retry-after says', async () => {
		const busy = Response.json({}, { headers: { 'retry-after': '7' }, status: 429 });
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValueOnce(busy)
			.mockResolvedValue(Response.json(DONE));
		wait.mockClear();

		await draftIntro(INPUT, { apiKey: API_KEY, fetch, wait });

		expect(wait).toHaveBeenCalledWith(7000);
	});

	it('gives up after three attempts, waiting longer each time', async () => {
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(Response.json({}, { status: 529 }));
		wait.mockClear();

		await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch, wait })).rejects.toThrow(
			'Die Anthropic-API antwortete mit 529.',
		);
		expect(fetch).toHaveBeenCalledTimes(3);
		expect(wait.mock.calls).toStrictEqual([[1000], [2000]]);
	});

	it('does not retry a request the api rejects', async () => {
		const fetch = answer(400, { error: { type: 'invalid_request_error' } });

		await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch, wait })).rejects.toThrow(
			'Die Anthropic-API antwortete mit 400.',
		);
		expect(fetch).toHaveBeenCalledOnce();
	});
});

describe('checking the key before the run', () => {
	it('asks the models endpoint for the intro model with the key', async () => {
		const fetch = answer(200, { id: 'claude-sonnet-5-5' });

		await expect(checkIntroAccess({ apiKey: API_KEY, fetch })).resolves.toBeUndefined();
		expect(fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/models/claude-sonnet-5-5', {
			headers: {
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json',
				'x-api-key': API_KEY,
			},
			method: 'GET',
		});
	});

	it.each([
		[
			401,
			'Der Anthropic-Key wird abgelehnt (401). Key prüfen oder ohne Intros importieren: --no-intro.',
		],
		[403, 'Der Anthropic-Key darf das Modell claude-sonnet-5-5 nicht nutzen (403).'],
		[404, 'Das Modell claude-sonnet-5-5 gibt es für diesen Key nicht (404).'],
		[529, 'Die Anthropic-API antwortete mit 529.'],
	])('explains a %i', async (status, message) => {
		await expect(checkIntroAccess({ apiKey: API_KEY, fetch: answer(status, {}) })).rejects.toThrow(
			message,
		);
	});
});
