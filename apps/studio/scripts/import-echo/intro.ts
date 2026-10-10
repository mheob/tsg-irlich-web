import { z } from 'zod';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODELS_URL = 'https://api.anthropic.com/v1/models';
const ANTHROPIC_VERSION = '2023-06-01';
const INTRO_MODEL = 'claude-sonnet-5-5';
/** Room for the model's own reasoning too; an intro itself needs about a hundred tokens. */
const MAX_TOKENS = 2000;
const COMPLETE = 'end_turn';
/** Rate limits, server errors and overload pass; everything else would fail again. */
const RETRYABLE_STATUSES = {
	badGateway: 502,
	gatewayTimeout: 504,
	internalServerError: 500,
	overloaded: 529,
	serviceUnavailable: 503,
	tooManyRequests: 429,
};
const RETRY_STATUSES: ReadonlySet<number> = new Set(Object.values(RETRYABLE_STATUSES));
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const BACKOFF_FACTOR = 2;
const MS_PER_SECOND = 1000;

/** What the preflight says for an answer that will repeat for every issue. */
const ACCESS_ERRORS: Record<number, string> = {
	401: 'Der Anthropic-Key wird abgelehnt (401). Key prüfen oder ohne Intros importieren: --no-intro.',
	403: `Der Anthropic-Key darf das Modell ${INTRO_MODEL} nicht nutzen (403).`,
	404: `Das Modell ${INTRO_MODEL} gibt es für diesen Key nicht (404).`,
};
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
const responseSchema = z.object({ content: z.array(contentBlockSchema), stop_reason: z.string() });

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
 * The headers every request to the Anthropic API carries.
 *
 * @param apiKey - The key from the shell.
 * @returns The headers.
 */
function toHeaders(apiKey: string): Record<string, string> {
	return {
		'anthropic-version': ANTHROPIC_VERSION,
		'content-type': 'application/json',
		'x-api-key': apiKey,
	};
}

/**
 * How long to wait before the next attempt: what `retry-after` asks for, else a doubling pause.
 *
 * @param response - The failed answer.
 * @param attempt - The 0-based number of the attempt that failed.
 * @returns The pause in milliseconds.
 */
function retryDelay(response: Response, attempt: number): number {
	const seconds = Number(response.headers.get('retry-after'));
	return seconds > 0 ? seconds * MS_PER_SECOND : RETRY_DELAY_MS * BACKOFF_FACTOR ** attempt;
}

/**
 * Posts a request, and tries again while the API is busy, at most three times in all.
 *
 * @param body - The JSON body.
 * @param api - The key, `fetch` and the pause between attempts.
 * @returns The last answer.
 */
async function postWithRetry(body: string, api: IntroApi): Promise<Response> {
	const send = async (): Promise<Response> =>
		api.fetch(ANTHROPIC_URL, { body, headers: toHeaders(api.apiKey), method: 'POST' });
	let response = await send();
	for (let attempt = 1; attempt < MAX_ATTEMPTS && RETRY_STATUSES.has(response.status); attempt++) {
		// oxlint-disable-next-line no-await-in-loop -- a retry has to wait for the attempt before it
		await api.wait(retryDelay(response, attempt - 1));
		// oxlint-disable-next-line no-await-in-loop -- see above
		response = await send();
	}
	return response;
}

/**
 * Checks once before the run that the key works and may use the model, without spending tokens.
 * A wrong key would otherwise import every issue without an intro, and a rerun skips them.
 *
 * @param api - The key from the shell and the `fetch` to send with.
 * @throws {Error} When the API refuses the key or the model, or does not answer.
 */
async function checkIntroAccess(api: Pick<IntroApi, 'apiKey' | 'fetch'>): Promise<void> {
	const response = await api.fetch(`${MODELS_URL}/${INTRO_MODEL}`, {
		headers: toHeaders(api.apiKey),
		method: 'GET',
	});
	if (!response.ok) {
		throw new Error(
			ACCESS_ERRORS[response.status] ?? `Die Anthropic-API antwortete mit ${response.status}.`,
		);
	}
}

/**
 * Drafts the intro of an issue. The editors review every draft before the release goes online.
 *
 * @param input - The first page images, the text layer, title and year.
 * @param api - The key from the shell, the `fetch` to send with and the pause between attempts.
 * @returns The intro.
 * @throws {Error} For a failed request, an answer that stopped early or has no text, or an issue
 *   with nothing to read.
 */
async function draftIntro(input: IntroInput, api: IntroApi): Promise<string> {
	const response = await postWithRetry(JSON.stringify(buildIntroRequest(input)), api);
	if (!response.ok) {
		throw new Error(`Die Anthropic-API antwortete mit ${response.status}.`);
	}
	const { content, stop_reason: stopReason } = responseSchema.parse(await response.json());
	if (stopReason !== COMPLETE) {
		throw new Error(`Die Anthropic-API brach das Intro ab (${stopReason}).`);
	}
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
	/** Pauses between attempts. */
	wait: (ms: number) => Promise<void>;
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

export { INTRO_PAGE_COUNT, buildIntroRequest, checkIntroAccess, draftIntro };
export type { IntroApi, IntroInput };
