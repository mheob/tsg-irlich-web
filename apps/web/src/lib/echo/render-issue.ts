import type { RenderedPage } from '@tsgi-web/pdf-pages';
import { settle } from '@tsgi-web/shared';

import { getPdfHash, getPdfUrl } from './asset-url';
import type { DatasetLocation } from './asset-url';
import type { EchoPage, EchoRenderState, EchoRenderStore, WriteOutcome } from './render-store';

/** Ends a run before Vercel's `maxDuration` (800 s) cuts it off without a trace. */
const TIME_BUDGET_MS = 750_000;
const MAX_WRITE_ATTEMPTS = 3;
const MAX_ERROR_LENGTH = 500;
const PAGE_NUMBER_DIGITS = 3;
const SHORT_HASH_LENGTH = 8;

/**
 * Turns a rejection reason into the message editors see in `render.error`.
 *
 * @param error - Whatever was thrown.
 * @returns The message, at most 500 characters long.
 */
function describeError(error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	return message.slice(0, MAX_ERROR_LENGTH);
}

/**
 * Uploads one rendered page and returns the array item that references it.
 *
 * @param page - The rendered page.
 * @param prefix - The start of the filename, `echo-<short hash>`.
 * @param store - The Sanity side.
 * @returns The page entry for the document's `pages` array.
 */
async function uploadPage(
	page: RenderedPage,
	prefix: string,
	store: EchoRenderStore,
): Promise<EchoPage> {
	const number = String(page.index).padStart(PAGE_NUMBER_DIGITS, '0');
	const assetId = await store.uploadPage(page.jpeg, `${prefix}-seite-${number}.jpg`);
	return {
		_key: `seite-${page.index}`,
		_type: 'image',
		asset: { _ref: assetId, _type: 'reference' },
	};
}

/**
 * Renders and uploads the pages one after the other, so only one page is in memory at a time.
 *
 * @param bytes - The PDF.
 * @param deps - The dependencies.
 * @param run - The filename prefix and the `now()` value after which the run gives up.
 * @returns The page entries and the text of every page.
 * @throws {Error} When the time budget runs out or a step fails.
 */
async function collectPages(
	bytes: Uint8Array,
	deps: RenderDependencies,
	run: { deadline: number; prefix: string },
): Promise<{ pages: EchoPage[]; texts: string[] }> {
	const pages: EchoPage[] = [];
	const texts: string[] = [];
	for await (const page of deps.renderPages(bytes)) {
		if (deps.now() > run.deadline) {
			throw new Error(
				'Zeitlimit überschritten: Die PDF konnte nicht vollständig verarbeitet werden.',
			);
		}
		pages.push(await uploadPage(page, run.prefix, deps.store));
		texts.push(`--- Seite ${page.index} ---\n${page.text}`);
	}
	return { pages, texts };
}

/**
 * Downloads the PDF, uploads every page and collects the text.
 *
 * @param job - The job.
 * @param deps - The dependencies.
 * @param deadline - The `now()` value after which the run gives up.
 * @returns The pages, their text and the page count.
 * @throws {Error} For an invalid reference, an empty PDF, the time budget or any failing step.
 */
async function renderAll(
	job: RenderJob,
	deps: RenderDependencies,
	deadline: number,
): Promise<{ extractedText: string; pageCount: number; pages: EchoPage[] }> {
	const hash = getPdfHash(job.pdfRef);
	const url = getPdfUrl(job.pdfRef, deps.location);
	if (hash === undefined || url === undefined) {
		throw new Error(`Ungültige PDF-Referenz ${job.pdfRef}`);
	}
	const bytes = await deps.downloadPdf(url);
	const prefix = `echo-${hash.slice(0, SHORT_HASH_LENGTH)}`;
	const { pages, texts } = await collectPages(bytes, deps, { deadline, prefix });
	if (pages.length === 0) {
		throw new Error('Die PDF enthält keine Seiten.');
	}
	return { extractedText: texts.join('\n\n'), pageCount: pages.length, pages };
}

/**
 * Writes a result against a freshly read revision, retrying when an editor saved in between.
 *
 * @param job - The job.
 * @param store - The Sanity side.
 * @param write - Performs the write for a given state.
 * @returns `written`, `discarded` when a newer run owns the document, or `conflict`.
 */
async function writeResult(
	job: RenderJob,
	store: EchoRenderStore,
	write: (state: EchoRenderState) => Promise<WriteOutcome>,
): Promise<'discarded' | WriteOutcome> {
	for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
		// oxlint-disable-next-line no-await-in-loop -- every retry has to read the revision again
		const state = await store.read(job.id);
		// Deleted, or a new PDF arrived: a newer run owns the document now.
		if (!state || state.pdfRef !== job.pdfRef) {
			return 'discarded';
		}
		// oxlint-disable-next-line no-await-in-loop -- see above
		if ((await write(state)) === 'written') {
			return 'written';
		}
	}
	return 'conflict';
}

/**
 * Claims a document for rendering. A document is only claimed while `render.source` differs from
 * its PDF, and the claim sets it to the PDF, so a second delivery and the write-back of the result
 * both leave it alone.
 *
 * @param store - The Sanity side.
 * @param payload - The document id and PDF reference from the webhook.
 * @param startedAt - The ISO timestamp of the claim.
 * @returns The job to run, or why there is none.
 */
async function claimRender(
	store: EchoRenderStore,
	payload: { id: string; pdfRef: string },
	startedAt: string,
): Promise<ClaimOutcome> {
	const state = await store.read(payload.id);
	if (!state) {
		return { status: 'missing' };
	}
	if (state.pdfRef !== payload.pdfRef) {
		return { status: 'stale' };
	}
	if (state.renderSource === state.pdfRef) {
		return { status: 'duplicate' };
	}
	const claimed = await store.claim(state, startedAt);
	return claimed === 'written'
		? { job: { id: state.id, pdfRef: payload.pdfRef, startedAt }, status: 'claimed' }
		: { status: 'conflict' };
}

/**
 * Renders a claimed document and writes the result back, or the failure if anything went wrong.
 * Nothing is written for a document that was deleted or got a new PDF while the run was busy.
 *
 * @param job - The job `claimRender` returned.
 * @param deps - Everything the run talks to.
 * @returns How the run ended.
 */
async function runRender(job: RenderJob, deps: RenderDependencies): Promise<RenderOutcome> {
	const deadline = deps.now() + TIME_BUDGET_MS;
	const rendered = await settle(renderAll(job, deps, deadline));
	const finishedAt = new Date(deps.now()).toISOString();
	const { startedAt } = job;

	if (rendered.ok) {
		const written = await writeResult(job, deps.store, async (state) =>
			deps.store.finish(state, { ...rendered.value, finishedAt, startedAt }),
		);
		return written === 'written' ? 'done' : written;
	}
	const error = describeError(rendered.error);
	const written = await writeResult(job, deps.store, async (state) =>
		deps.store.fail(state, { error, finishedAt, startedAt }),
	);
	return written === 'written' ? 'failed' : written;
}

type ClaimOutcome =
	| { job: RenderJob; status: 'claimed' }
	| { status: 'conflict' | 'duplicate' | 'missing' | 'stale' };

type RenderOutcome = 'conflict' | 'discarded' | 'done' | 'failed';

interface RenderJob {
	id: string;
	pdfRef: string;
	startedAt: string;
}

interface RenderDependencies {
	downloadPdf: (url: string) => Promise<Uint8Array>;
	location: DatasetLocation;
	now: () => number;
	renderPages: (bytes: Uint8Array) => AsyncIterable<RenderedPage>;
	store: EchoRenderStore;
}

export { claimRender, runRender };
export type { ClaimOutcome, RenderDependencies, RenderJob, RenderOutcome };
