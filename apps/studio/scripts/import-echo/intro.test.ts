// @vitest-environment node
import { randomUUID } from 'node:crypto';

import { describe, expect, it, vi } from 'vite-plus/test';

import { buildIntroRequest, draftIntro } from './intro';
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
	return vi.fn<typeof fetch>().mockResolvedValue(Response.json(body, { status }));
}

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

		expect(request).toMatchObject({ max_tokens: 400, model: 'claude-sonnet-5-5' });
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
		const fetch = answer(200, { content: [{ text: ' Ein Intro. ', type: 'text' }] });

		await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch })).resolves.toBe('Ein Intro.');
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

		await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch })).rejects.toThrow(
			'Die Anthropic-API antwortete mit 401.',
		);
	});

	it('refuses an answer without text', async () => {
		const fetch = answer(200, { content: [{ text: '  ', type: 'text' }] });

		await expect(draftIntro(INPUT, { apiKey: API_KEY, fetch })).rejects.toThrow(
			'Die Anthropic-API lieferte kein Intro.',
		);
	});
});
