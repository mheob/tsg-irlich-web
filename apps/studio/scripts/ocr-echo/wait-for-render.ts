import type { RenderState, SwapStore, SwapTarget } from './swap-store';

const POLL_INTERVAL_MS = 5000;
/** The webhook claims a document within seconds; two minutes without a claim means it never fired. */
const START_TIMEOUT_MS = 120_000;
/** The render route gives up after 800 s itself, so a render this old will not finish anymore. */
const RENDER_TIMEOUT_MS = 900_000;

/**
 * What a finished render of the new PDF means.
 *
 * @param state - The render state of a document that carries the new PDF.
 * @param assetId - The PDF the script swapped in.
 * @returns The result once the render of that PDF ended, `undefined` while it has not.
 */
function judgeRender(state: RenderState, assetId: string): RenderResult | undefined {
	if (state.source !== assetId) {
		return undefined;
	}
	if (state.status === 'done') {
		return { ok: true, textLength: state.textLength };
	}
	if (state.status === 'failed') {
		return { error: `Render gescheitert: ${state.error ?? 'ohne Grund'}`, ok: false };
	}
	return undefined;
}

/**
 * Whether the wait has lasted too long.
 *
 * @param claimed - Whether the render route has claimed the new PDF yet.
 * @param elapsed - The milliseconds since the wait began.
 * @returns Why the run gives up, or `undefined` to keep waiting.
 */
function judgeTime(claimed: boolean, elapsed: number): RenderResult | undefined {
	if (!claimed && elapsed >= START_TIMEOUT_MS) {
		return {
			error:
				'Der Render-Webhook hat nach 2 Minuten nicht ausgelöst. Den Webhook „TSG-Echo Seiten erzeugen“ des Datasets prüfen.',
			ok: false,
		};
	}
	if (elapsed >= RENDER_TIMEOUT_MS) {
		return { error: 'Der Render ist nach 15 Minuten nicht fertig.', ok: false };
	}
	return undefined;
}

/**
 * Decides what one look at the document means.
 *
 * @param state - The render state now.
 * @param assetId - The PDF the script swapped in.
 * @param elapsed - The milliseconds since the wait began.
 * @returns The result once there is one, `undefined` to keep waiting.
 */
function judge(
	state: RenderState | undefined,
	assetId: string,
	elapsed: number,
): RenderResult | undefined {
	if (!state) {
		return { error: 'Die Ausgabe ist verschwunden.', ok: false };
	}
	if (state.pdfRef !== assetId) {
		return { error: 'Die PDF der Ausgabe wurde inzwischen ersetzt.', ok: false };
	}
	return judgeRender(state, assetId) ?? judgeTime(state.source === assetId, elapsed);
}

/**
 * Waits until the render webhook has rebuilt the pages and `extractedText` for the new PDF, so the
 * runs on Vercel follow one another and every entry ends with its result.
 *
 * @param target - The issue that got the new PDF.
 * @param assetId - The new PDF.
 * @param deps - The clock, the pause and the store's read.
 * @returns The length of `extractedText`, or why the render did not finish.
 */
async function waitForRender(
	target: SwapTarget,
	assetId: string,
	deps: WaitDeps,
): Promise<RenderResult> {
	const startedAt = deps.now();
	const look = async (): Promise<RenderResult | undefined> =>
		judge(await deps.readRender(target), assetId, deps.now() - startedAt);
	let result = await look();
	while (!result) {
		// oxlint-disable-next-line no-await-in-loop -- polling waits between one look and the next
		await deps.wait(POLL_INTERVAL_MS);
		// oxlint-disable-next-line no-await-in-loop -- see above
		result = await look();
	}
	return result;
}

interface WaitDeps {
	now: () => number;
	readRender: SwapStore['readRender'];
	wait: (ms: number) => Promise<void>;
}

type RenderResult = { error: string; ok: false } | { ok: true; textLength: number };

export { waitForRender };
export type { RenderResult, WaitDeps };
