import { settle } from '@tsgi-web/shared';

import type { OcrEntry } from './manifest';
import type { OcrTools } from './ocrmypdf';
import type { SwapStore, SwapTarget } from './swap-store';
import { needsRecognition, prepareTextLayer } from './text-layer';
import type { PreparedPdf, TextLayerDeps } from './text-layer';
import { RENDER_TIMEOUT_MS, RERENDER_HINT, waitForRender } from './wait-for-render';

const SOURCE_LABELS: Record<PreparedPdf['source'], string> = {
	cached: 'schon erkannt',
	original: 'mit Textebene',
	recognized: 'erkannt',
};

const RERENDER = `Die PDF ist schon getauscht, aber ihr Render ist nicht fertig. ${RERENDER_HINT}`;

/**
 * A rejection reason as text.
 *
 * @param error - Whatever was thrown.
 * @returns The message.
 */
function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * What the swap creates or changes, for the log.
 *
 * @param target - The issue.
 * @returns `neuer Entwurf` for a published issue, `Entwurf` for a draft.
 */
function describeTarget(target: SwapTarget): string {
	return target.kind === 'published' ? 'neuer Entwurf' : 'Entwurf';
}

/**
 * Checks the OCR tools before anything is touched, but only when an entry needs them. An entry
 * whose file cannot be read needs none here and fails later with its real error.
 *
 * @param entries - The entries of the list.
 * @param deps - The text layer and the tools.
 * @throws {Error} When OCRmyPDF or Tesseract's German is missing.
 */
async function checkTools(entries: readonly OcrEntry[], deps: OcrDependencies): Promise<void> {
	for (const entry of entries) {
		// oxlint-disable-next-line no-await-in-loop -- reads one PDF at a time and stops at the first that needs OCR
		const needed = await settle(needsRecognition(entry, deps.textLayer));
		if (needed.ok && needed.value) {
			// oxlint-disable-next-line no-await-in-loop -- runs once, right before the loop ends
			await deps.tools.assertInstalled();
			return;
		}
	}
}

/**
 * Waits for the render of the new PDF and logs its outcome.
 *
 * @param target - The issue.
 * @param assetId - The new PDF.
 * @param deps - The store, the clock and the log.
 * @returns Nothing; it throws when the render did not finish.
 * @throws {Error} With the reason the render did not finish.
 */
async function finishRender(
	target: SwapTarget,
	assetId: string,
	deps: OcrDependencies,
): Promise<void> {
	const result = await waitForRender(target, assetId, {
		now: deps.now,
		readRender: deps.store.readRender,
		wait: deps.wait,
	});
	if (!result.ok) {
		throw new Error(result.error);
	}
	deps.log(`  Render fertig, extractedText ${result.textLength} Zeichen`);
}

/**
 * Notes in a dry run that an earlier run's render is still going.
 *
 * @param deps - The log.
 * @returns `checked`.
 */
function reportRunningRender(deps: OcrDependencies): EntryOutcome {
	deps.log('  schon getauscht, der Render läuft noch');
	return 'checked';
}

/**
 * Waits for the render an earlier run started.
 *
 * @param target - The issue, already carrying its new PDF.
 * @param deps - The store, the clock and the log.
 * @returns `skipped`, since this run swapped nothing.
 * @throws {Error} With the reason the render did not finish.
 */
async function awaitRunningRender(
	target: SwapTarget,
	deps: OcrDependencies,
): Promise<EntryOutcome> {
	deps.log('  schon getauscht, warte auf den Render');
	await finishRender(target, target.pdf.assetId, deps);
	return 'skipped';
}

/**
 * Whether the render of an issue's current PDF will not finish anymore: it failed, it never
 * started, or the platform killed it before it could write `failed`, which leaves it `pending` for
 * good.
 *
 * @param target - The issue, already carrying its new PDF.
 * @param now - The current time in milliseconds.
 * @returns `true` when only „Seiten neu erzeugen“ helps.
 */
function isStuck(target: SwapTarget, now: number): boolean {
	const { render } = target;
	if (render.source !== target.pdf.assetId || render.status === 'failed') {
		return true;
	}
	return (
		render.status === 'pending' &&
		render.startedAt !== undefined &&
		now - Date.parse(render.startedAt) > RENDER_TIMEOUT_MS
	);
}

/**
 * Handles an issue that already carries this PDF: done, still rendering, or stuck.
 *
 * @param target - The issue.
 * @param deps - The store, the clock and the log.
 * @param dryRun - Whether to only look.
 * @returns `skipped`, or `checked` in a dry run while the render is still running.
 * @throws {Error} For a render that failed, never started on this PDF, or was cut off.
 */
async function checkSwapped(
	target: SwapTarget,
	deps: OcrDependencies,
	dryRun: boolean,
): Promise<EntryOutcome> {
	const { render } = target;
	if (isStuck(target, deps.now())) {
		throw new Error(RERENDER);
	}
	if (render.status === 'done') {
		deps.log('  schon getauscht, übersprungen');
		return 'skipped';
	}
	return dryRun ? reportRunningRender(deps) : awaitRunningRender(target, deps);
}

/**
 * Uploads the PDF under the old file name, points the draft at it and waits for its render.
 *
 * @param prepared - The PDF with its text layer.
 * @param target - The issue.
 * @param deps - The store, the clock and the log.
 * @throws {Error} For a failing upload, swap or render.
 */
async function swap(
	prepared: PreparedPdf,
	target: SwapTarget,
	deps: OcrDependencies,
): Promise<void> {
	const filename = target.pdf.originalFilename ?? `${target.documentId}.pdf`;
	const assetId = await deps.store.uploadPdf(prepared.bytes, filename);
	await deps.store.swapPdf(target, assetId);
	deps.log(`  getauscht (${describeTarget(target)}), warte auf den Render`);
	await finishRender(target, assetId, deps);
}

/**
 * Gives one entry its text layer and swaps it into the issue's draft, or only looks in a dry run.
 *
 * @param entry - The entry of the list.
 * @param deps - The dependencies.
 * @param dryRun - Whether to only look.
 * @returns What happened.
 * @throws {Error} For any failing step; the run records it.
 */
async function processEntry(
	entry: OcrEntry,
	deps: OcrDependencies,
	dryRun: boolean,
): Promise<EntryOutcome> {
	const prepared = await prepareTextLayer(entry, deps.textLayer);
	deps.log(
		`${entry.documentId}: ${prepared.pageCount} Seiten, ${SOURCE_LABELS[prepared.source]}, ${prepared.characters} Zeichen`,
	);
	const target = await deps.store.findTarget(entry.documentId);
	if (target.pdf.sha1hash === deps.sha1(prepared.bytes)) {
		return checkSwapped(target, deps, dryRun);
	}
	if (dryRun) {
		deps.log(`  würde getauscht (${describeTarget(target)})`);
		return 'checked';
	}
	await swap(prepared, target, deps);
	return 'swapped';
}

/**
 * Gives every entry of the list its text layer and swaps it into the issue's draft, one after the
 * other, so one render runs on Vercel at a time. In a dry run it recognizes, but writes nothing to
 * Sanity.
 *
 * @param entries - The entries of the list.
 * @param deps - Everything the run talks to.
 * @param options - Whether this is a dry run.
 * @returns What happened to every entry.
 * @throws {Error} When an entry needs OCR and the tools are missing, before anything is touched.
 */
async function runOcrSwap(
	entries: readonly OcrEntry[],
	deps: OcrDependencies,
	options: { dryRun: boolean },
): Promise<OcrReport> {
	await checkTools(entries, deps);
	const report: OcrReport = { checked: [], failed: [], skipped: [], swapped: [] };
	for (const entry of entries) {
		// oxlint-disable-next-line no-await-in-loop -- one entry at a time keeps one render running
		const outcome = await settle(processEntry(entry, deps, options.dryRun));
		if (outcome.ok) {
			report[outcome.value].push(entry.documentId);
		} else {
			const error = describeError(outcome.error);
			deps.log(`  Fehler: ${error}`);
			report.failed.push({ documentId: entry.documentId, error });
		}
	}
	return report;
}

/**
 * Whether the run left nothing to fix.
 *
 * @param report - The report of the run.
 * @returns `false` with any failed entry.
 */
function isSuccessful(report: OcrReport): boolean {
	return report.failed.length === 0;
}

/**
 * The closing lines of a run, in German.
 *
 * @param report - The report of the run.
 * @param dryRun - Whether it was a dry run.
 * @returns The lines, the counts first.
 */
function summarize(report: OcrReport, dryRun: boolean): string[] {
	const done = dryRun
		? `Probelauf: ${report.checked.length} geprüft`
		: `Getauscht: ${report.swapped.length}`;
	return [
		`${done}, übersprungen: ${report.skipped.length}, fehlgeschlagen: ${report.failed.length}`,
		...report.failed.map((failure) => `Fehlgeschlagen: ${failure.documentId} (${failure.error})`),
	];
}

type EntryOutcome = 'checked' | 'skipped' | 'swapped';

interface OcrDependencies {
	log: (line: string) => void;
	now: () => number;
	/** The hex SHA-1 of a file, as Sanity stores it in `sha1hash`. */
	sha1: (bytes: Uint8Array) => string;
	store: SwapStore;
	textLayer: TextLayerDeps;
	tools: OcrTools;
	wait: (ms: number) => Promise<void>;
}

interface OcrReport {
	checked: string[];
	failed: { documentId: string; error: string }[];
	skipped: string[];
	swapped: string[];
}

export { isSuccessful, runOcrSwap, summarize };
export type { OcrDependencies, OcrReport };
