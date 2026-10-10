import { z } from 'zod';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const INTRO_MODEL = 'claude-sonnet-5-5';
const MAX_TOKENS = 400;
/** The cover and the next two pages show what an issue is about. */
const INTRO_PAGE_COUNT = 3;
/** The start of a digital issue's text layer is context enough and keeps the request small. */
const MAX_TEXT_LENGTH = 6000;
/** The API takes an image of up to 5 MB in base64, which is 4/3 of the raw size. */
const MAX_IMAGE_BYTES = 3_750_000;

const SYSTEM_PROMPT = [
	'Du schreibst Intros für das Online-Archiv des TSG ECHO, des Vereinsmagazins der TSG Irlich.',
	'Ein Intro hat zwei bis drei Sätze und sagt, worum es in der Ausgabe geht: Themen, Abteilungen, Anlässe.',
	'Nenne keine Namen von Personen und keine Adressen, Telefonnummern, E-Mail-Adressen oder Geburtstage.',
	'Schreibe sachlich auf Deutsch, ohne Werbesprache, ohne Anführungszeichen und ohne Überschrift.',
	'Antworte nur mit dem Intro.',
].join(' ');

const contentBlockSchema = z.object({ text: z.string().optional(), type: z.string() });
const responseSchema = z.object({ content: z.array(contentBlockSchema) });

/**
 * One page image as a content block of the Messages API.
 *
 * @param jpeg - The rendered page.
 * @returns The image block.
 */
function toImageBlock(jpeg: Uint8Array): ImageBlock {
	return {
		source: {
			data: Buffer.from(jpeg).toString('base64'),
			media_type: 'image/jpeg',
			type: 'base64',
		},
		type: 'image',
	};
}

/**
 * What the model is asked, with the text layer when the issue has one.
 *
 * @param input - Title, year and text of the issue.
 * @returns The text block.
 */
function toQuestion(input: IntroInput): TextBlock {
	const ask = `Schreibe das Intro für „${input.title}“ (${input.year}).`;
	const excerpt = input.text.slice(0, MAX_TEXT_LENGTH);
	const text = excerpt
		? `${ask}\n\nTextebene der Ausgabe (Auszug):\n${excerpt}`
		: `${ask} Die Ausgabe ist ein Scan ohne Textebene, lies die Seitenbilder.`;
	return { text, type: 'text' };
}

/**
 * The Messages API request for one intro.
 *
 * @param input - The first page images, the text layer, title and year.
 * @returns The request body.
 * @throws {Error} When the issue offers neither a usable image nor text.
 */
function buildIntroRequest(input: IntroInput): IntroRequest {
	const images = input.images
		.filter((jpeg) => jpeg.byteLength <= MAX_IMAGE_BYTES)
		.slice(0, INTRO_PAGE_COUNT)
		.map((jpeg) => toImageBlock(jpeg));
	if (images.length === 0 && !input.text) {
		throw new Error('Für das Intro fehlen Seitenbilder und Text.');
	}
	return {
		max_tokens: MAX_TOKENS,
		messages: [{ content: [...images, toQuestion(input)], role: 'user' }],
		model: INTRO_MODEL,
		system: SYSTEM_PROMPT,
	};
}

/**
 * Drafts the intro of an issue. The editors review every draft before the release goes online.
 *
 * @param input - The first page images, the text layer, title and year.
 * @param api - The key from the shell and the `fetch` to send with.
 * @returns The intro.
 * @throws {Error} For a failed request, an answer without text or an issue with nothing to read.
 */
async function draftIntro(input: IntroInput, api: IntroApi): Promise<string> {
	const response = await api.fetch(ANTHROPIC_URL, {
		body: JSON.stringify(buildIntroRequest(input)),
		headers: {
			'anthropic-version': ANTHROPIC_VERSION,
			'content-type': 'application/json',
			'x-api-key': api.apiKey,
		},
		method: 'POST',
	});
	if (!response.ok) {
		throw new Error(`Die Anthropic-API antwortete mit ${response.status}.`);
	}
	const { content } = responseSchema.parse(await response.json());
	const intro = content
		.map((block) => block.text ?? '')
		.join('')
		.trim();
	if (!intro) {
		throw new Error('Die Anthropic-API lieferte kein Intro.');
	}
	return intro;
}

interface IntroInput {
	/** The rendered pages, cover first. Only the first three are sent. */
	images: Uint8Array[];
	/** The issue's `extractedText`; empty for a scan. */
	text: string;
	title: string;
	year: string;
}

interface IntroApi {
	apiKey: string;
	fetch: typeof fetch;
}

interface ImageBlock {
	source: { data: string; media_type: 'image/jpeg'; type: 'base64' };
	type: 'image';
}

interface TextBlock {
	text: string;
	type: 'text';
}

interface IntroRequest {
	max_tokens: number;
	messages: { content: (ImageBlock | TextBlock)[]; role: 'user' }[];
	model: string;
	system: string;
}

export { INTRO_PAGE_COUNT, buildIntroRequest, draftIntro };
export type { IntroApi, IntroInput };
