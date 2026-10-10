import type { RenderedPage } from '@tsgi-web/pdf-pages';
import { settle } from '@tsgi-web/shared';

import { getPdfHash, getPdfUrl } from './asset-url';
import type { DatasetLocation } from './asset-url';
import { RenderError } from './render-error';
import type { EchoPage, EchoRenderState, EchoRenderStore, WriteOutcome } from './render-store';

/** Ends a run before Vercel's `maxDuration` (800 s) cuts it off without a trace. */
const TIME_BUDGET_MS = 750_000;
const MAX_WRITE_ATTEMPTS = 3;
/** The pause before the second write attempt; it doubles for every further one. */
const RETRY_DELAY_MS = 1000;
const BACKOFF_FACTOR = 2;
const DRAFTS_PREFIX = 'drafts.';
const MAX_ERROR_LENGTH = 500;
const PAGE_NUMBER_DIGITS = 3;
const SHORT_HASH_LENGTH = 8;

/**
 * Explains a rejection reason in German. The pipeline's own errors already do; pdf.js and Sanity
 * speak English, so their message is prefixed.
 *
 * @param error - Whatever was thrown.
 * @returns The explanation.
 */
function explainError(error: unknown): string {
	if (error instanceof RenderError) {
		return error.message;
	}
	if (error instanceof Error && error.name === 'PasswordException') {
		return 'Die PDF ist passwortgeschützt.';
	}
	const message = error instanceof Error ? error.message : String(error);
	return `Die Seiten konnten nicht erzeugt werden: ${message}`;
}

/**
 * Turns a rejection reason into the message editors see in `render.error`.
 *
 * @param error - Whatever was thrown.
 * @returns The message, at most 500 characters long.
 */
function describeError(error: unknown): string {
	return explainError(error).slice(0, MAX_ERROR_LENGTH);
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
			throw new RenderError(
				'Zeitlimit überschritten: Die PDF konnte nicht vollständig verarbeitet werden.',
			);
		}
		pages.push(await uploadPage(page, run.prefix, deps.store));
		// A scan has no text layer; its pages leave `extractedText` empty instead of adding headings.
		if (page.text) {
			texts.push(`--- Seite ${page.index} ---\n${page.text}`);
		}
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
		throw new RenderError(`Ungültige PDF-Referenz ${job.pdfRef}`);
	}
	const bytes = await deps.downloadPdf(url);
	const prefix = `echo-${hash.slice(0, SHORT_HASH_LENGTH)}`;
	const { pages, texts } = await collectPages(bytes, deps, { deadline, prefix });
	if (pages.length === 0) {
		throw new RenderError('Die PDF enthält keine Seiten.');
	}
	return { extractedText: texts.join('\n\n'), pageCount: pages.length, pages };
}

/**
 * Whether a document still belongs to the run: same PDF, and no newer run has claimed it since.
 *
 * @param state - The document as read now.
 * @param job - The run.
 * @returns `true` while the run owns the document.
 */
function isOwnedBy(state: EchoRenderState, job: RenderJob): boolean {
	return state.pdfRef === job.pdfRef && state.renderStartedAt === job.startedAt;
}

/**
 * Reads the document the run has to write to. Publishing a draft deletes it and copies its claim
 * into the published document, so that one is tried when the draft is gone.
 *
 * @param job - The run.
 * @param store - The Sanity side.
 * @returns The document, or `null` when it is gone or a newer run owns it.
 */
async function readOwnedState(
	job: RenderJob,
	store: EchoRenderStore,
): Promise<EchoRenderState | null> {
	const state = await store.read(job.id);
	if (state) {
		return isOwnedBy(state, job) ? state : null;
	}
	if (!job.id.startsWith(DRAFTS_PREFIX)) {
		return null;
	}
	const published = await store.read(job.id.slice(DRAFTS_PREFIX.length));
	return published && isOwnedBy(published, job) ? published : null;
}

/**
 * Writes a result against a freshly read revision, retrying with a growing pause when an editor
 * saved in between.
 *
 * @param job - The job.
 * @param deps - The store to write to and the clock to wait with.
 * @param write - Performs the write for a given state.
 * @returns `written`, `discarded` when the document is gone or a newer run owns it, or `conflict`.
 */
async function writeResult(
	job: RenderJob,
	deps: RenderDependencies,
	write: (state: EchoRenderState) => Promise<WriteOutcome>,
): Promise<'discarded' | WriteOutcome> {
	for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
		if (attempt > 0) {
			// oxlint-disable-next-line no-await-in-loop -- the retries have to wait one after the other
			await deps.wait(RETRY_DELAY_MS * BACKOFF_FACTOR ** (attempt - 1));
		}
		// oxlint-disable-next-line no-await-in-loop -- every retry has to read the revision again
		const state = await readOwnedState(job, deps.store);
		if (!state) {
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
 * Writes a failed run, so that the document never stays `pending`.
 *
 * @param job - The job.
 * @param deps - The dependencies.
 * @param failure - The message and the end time.
 * @returns `failed`, `discarded` or `conflict`.
 * @throws {unknown} When Sanity cannot take even the failure; the route logs it.
 */
async function recordFailure(
	job: RenderJob,
	deps: RenderDependencies,
	failure: { error: string; finishedAt: string },
): Promise<RenderOutcome> {
	const written = await writeResult(job, deps, async (state) =>
		deps.store.fail(state, { ...failure, startedAt: job.startedAt }),
	);
	return written === 'written' ? 'failed' : written;
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
	if (!rendered.ok) {
		return recordFailure(job, deps, { error: describeError(rendered.error), finishedAt });
	}

	const finished = await settle(
		writeResult(job, deps, async (state) =>
			deps.store.finish(state, { ...rendered.value, finishedAt, startedAt: job.startedAt }),
		),
	);
	if (!finished.ok) {
		return recordFailure(job, deps, { error: describeError(finished.error), finishedAt });
	}
	return finished.value === 'written' ? 'done' : finished.value;
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
	/** Pauses between write attempts. */
	wait: (ms: number) => Promise<void>;
}

export { claimRender, runRender };
export type { ClaimOutcome, RenderDependencies, RenderJob, RenderOutcome };
