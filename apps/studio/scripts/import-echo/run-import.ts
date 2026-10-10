import type { RenderedPage } from '@tsgi-web/pdf-pages';
import { settle } from '@tsgi-web/shared';

import type { ArchiveStore } from './archive-store';
import { INTRO_PAGE_COUNT } from './intro';
import type { IntroInput } from './intro';
import {
	ARCHIVE_CUTOFF,
	RELEASE_TITLE,
	buildIssueDocument,
	toPageEntry,
	toPageFilename,
	toPageText,
} from './issue-document';
import type { EchoPage } from './issue-document';
import type { IssuePlan } from './manifest';

const YEAR_LENGTH = 4;
const TEXT_SEPARATOR = '\n\n';

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
 * Makes sure the release can take versions, and creates it on a real run when it is missing.
 *
 * @param deps - The store and the log.
 * @param dryRun - Whether to only read.
 * @throws {Error} When the release exists but is no longer open.
 */
async function prepareRelease(deps: ImportDependencies, dryRun: boolean): Promise<void> {
	const state = await deps.store.getReleaseState();
	if (state === undefined) {
		deps.log(`Release „${RELEASE_TITLE}“ ${dryRun ? 'würde angelegt' : 'wird angelegt'}.`);
		if (!dryRun) {
			await deps.store.createRelease();
		}
		return;
	}
	if (state !== 'active') {
		throw new Error(
			`Der Release „${RELEASE_TITLE}“ ist ${state} und nimmt keine Ausgaben mehr auf.`,
		);
	}
}

/**
 * Uploads one rendered page and remembers what the document and the intro need of it.
 *
 * @param page - The rendered page.
 * @param target - The PDF the page belongs to and what has been collected so far.
 * @param store - The Sanity side.
 */
async function collectPage(
	page: RenderedPage,
	target: PageTarget,
	store: ArchiveStore,
): Promise<void> {
	const assetId = await store.uploadPage(page.jpeg, toPageFilename(target.pdfAssetId, page.index));
	target.collected.pages.push(toPageEntry(assetId, page.index));
	if (target.collected.introImages.length < INTRO_PAGE_COUNT) {
		target.collected.introImages.push(page.jpeg);
	}
	const text = toPageText(page);
	if (text) {
		target.collected.texts.push(text);
	}
}

/**
 * Renders the PDF and uploads its pages one after the other, so only one page is in memory.
 *
 * @param bytes - The PDF.
 * @param pdfAssetId - The id of the uploaded PDF.
 * @param deps - The renderer and the store.
 * @returns The page entries, the text blocks and the first page images.
 * @throws {Error} For a PDF without pages or a failing step.
 */
async function uploadPages(
	bytes: Uint8Array,
	pdfAssetId: string,
	deps: ImportDependencies,
): Promise<CollectedPages> {
	const collected: CollectedPages = { introImages: [], pages: [], texts: [] };
	for await (const page of deps.renderPages(bytes)) {
		await collectPage(page, { collected, pdfAssetId }, deps.store);
	}
	if (collected.pages.length === 0) {
		throw new Error('Die PDF enthält keine Seiten.');
	}
	return collected;
}

/**
 * Drafts the intro, or explains in the log why there is none.
 *
 * @param plan - The issue.
 * @param collected - Its first page images and its text.
 * @param deps - `draftIntro` and the log.
 * @returns The intro, or `undefined` without one.
 */
async function draftIntroFor(
	plan: IssuePlan,
	collected: CollectedPages,
	deps: ImportDependencies,
): Promise<string | undefined> {
	if (!deps.draftIntro) {
		return undefined;
	}
	const drafted = await settle(
		deps.draftIntro({
			images: collected.introImages,
			text: collected.texts.join(TEXT_SEPARATOR),
			title: plan.title,
			year: plan.releaseDate.slice(0, YEAR_LENGTH),
		}),
	);
	if (drafted.ok) {
		return drafted.value;
	}
	deps.log(`  Kein Intro: ${describeError(drafted.error)}`);
	return undefined;
}

/**
 * Imports one issue: PDF, pages, intro, then the version in the release, which comes last, so an
 * interrupted issue leaves no document behind.
 *
 * @param plan - The issue.
 * @param deps - The dependencies.
 * @returns `created`, or `createdWithoutIntro`.
 */
async function importIssue(plan: IssuePlan, deps: ImportDependencies): Promise<IssueOutcome> {
	const bytes = await deps.readPdf(plan.file);
	const startedAt = deps.now().toISOString();
	const pdfAssetId = await deps.store.uploadPdf(bytes, `${plan.slug}.pdf`);
	const collected = await uploadPages(bytes, pdfAssetId, deps);
	const intro = await draftIntroFor(plan, collected, deps);
	const document = buildIssueDocument(plan, {
		extractedText: collected.texts.join(TEXT_SEPARATOR),
		finishedAt: deps.now().toISOString(),
		intro,
		pages: collected.pages,
		pdfAssetId,
		startedAt,
	});
	await deps.store.createVersion(plan.documentId, document);
	return intro ? 'created' : 'createdWithoutIntro';
}

/**
 * Renders one issue without writing anything, to find broken PDFs before the real run.
 *
 * @param plan - The issue.
 * @param deps - The file reader, the renderer and the log.
 * @returns `checked`.
 * @throws {Error} For a PDF without pages or one pdf.js cannot read.
 */
async function checkIssue(plan: IssuePlan, deps: ImportDependencies): Promise<IssueOutcome> {
	let pageCount = 0;
	let hasText = false;
	for await (const page of deps.renderPages(await deps.readPdf(plan.file))) {
		pageCount += 1;
		hasText ||= page.text !== '';
	}
	if (pageCount === 0) {
		throw new Error('Die PDF enthält keine Seiten.');
	}
	deps.log(`  ${pageCount} Seiten, ${hasText ? 'mit Textebene' : 'Scan ohne Textebene'}`);
	return 'checked';
}

/**
 * Files the outcome of one issue in the report.
 *
 * @param report - The report of the run.
 * @param documentId - The issue.
 * @param outcome - What happened to it.
 */
function record(report: ImportReport, documentId: string, outcome: IssueOutcome): void {
	if (outcome === 'checked') {
		report.checked.push(documentId);
		return;
	}
	report.created.push(documentId);
	if (outcome === 'createdWithoutIntro') {
		report.withoutIntro.push(documentId);
	}
}

/**
 * Logs a failed issue and files it in the report.
 *
 * @param run - The log and the report.
 * @param documentId - The issue.
 * @param error - Whatever was thrown.
 */
function recordFailure(run: ImportRun, documentId: string, error: unknown): void {
	const message = describeError(error);
	run.deps.log(`  Fehler: ${message}`);
	run.report.failed.push({ documentId, error: message });
}

/**
 * Skips, checks or imports one issue. A failure is recorded, never thrown, so one broken PDF does
 * not stop the other issues.
 *
 * @param plan - The issue.
 * @param run - The dependencies, the existing ids, the mode and the report.
 */
async function processIssue(plan: IssuePlan, run: ImportRun): Promise<void> {
	if (run.existing.has(plan.documentId)) {
		run.deps.log(`${plan.title}: schon vorhanden, übersprungen`);
		run.report.skipped.push(plan.documentId);
		return;
	}
	run.deps.log(`${plan.title}: ${run.dryRun ? 'prüfen' : 'importieren'}`);
	const outcome = await settle(
		run.dryRun ? checkIssue(plan, run.deps) : importIssue(plan, run.deps),
	);
	if (outcome.ok) {
		record(run.report, plan.documentId, outcome.value);
		return;
	}
	recordFailure(run, plan.documentId, outcome.error);
}

/**
 * Imports the archive into the release "TSG-Echo-Archiv", or only checks it in a dry run. The
 * issues run one after the other, so only one PDF is in memory at a time.
 *
 * @param plans - The issues of the manifest.
 * @param deps - Everything the run talks to.
 * @param options - Whether this is a dry run.
 * @returns What happened to every issue, and every indexable issue before 2013.
 * @throws {Error} When the release exists but no longer takes versions.
 */
async function runImport(
	plans: readonly IssuePlan[],
	deps: ImportDependencies,
	options: { dryRun: boolean },
): Promise<ImportReport> {
	await prepareRelease(deps, options.dryRun);
	const existing = await deps.store.findExisting(plans.map((plan) => plan.documentId));
	const report: ImportReport = {
		checked: [],
		created: [],
		failed: [],
		indexableBefore: [],
		skipped: [],
		withoutIntro: [],
	};
	for (const plan of plans) {
		// oxlint-disable-next-line no-await-in-loop -- one issue at a time keeps one PDF in memory
		await processIssue(plan, { deps, dryRun: options.dryRun, existing, report });
	}
	report.indexableBefore = await deps.store.findIndexableBefore(ARCHIVE_CUTOFF);
	return report;
}

/**
 * Whether the run left nothing to fix.
 *
 * @param report - The report of the run.
 * @returns `false` for a failed issue or an indexable issue before 2013.
 */
function isSuccessful(report: ImportReport): boolean {
	return report.failed.length === 0 && report.indexableBefore.length === 0;
}

/**
 * The closing lines of a run, in German.
 *
 * @param report - The report of the run.
 * @param dryRun - Whether it was a dry run.
 * @returns The lines, the counts first.
 */
function summarize(report: ImportReport, dryRun: boolean): string[] {
	const done = dryRun
		? `Probelauf: ${report.checked.length} geprüft`
		: `Angelegt: ${report.created.length}`;
	return [
		`${done}, übersprungen: ${report.skipped.length}, fehlgeschlagen: ${report.failed.length}`,
		...report.failed.map((failure) => `Fehlgeschlagen: ${failure.documentId} (${failure.error})`),
		...(report.withoutIntro.length > 0 ? [`Ohne Intro: ${report.withoutIntro.join(', ')}`] : []),
		...(report.indexableBefore.length > 0
			? [`Auffindbar trotz Erscheinen vor 2013: ${report.indexableBefore.join(', ')}`]
			: []),
	];
}

type IssueOutcome = 'checked' | 'created' | 'createdWithoutIntro';

interface CollectedPages {
	/** The first pages, for the intro. */
	introImages: Uint8Array[];
	pages: EchoPage[];
	/** One block per page with text. */
	texts: string[];
}

interface PageTarget {
	collected: CollectedPages;
	pdfAssetId: string;
}

interface ImportDependencies {
	/** Drafts an intro; left out with `--no-intro` and in a dry run. */
	draftIntro?: (input: IntroInput) => Promise<string>;
	log: (line: string) => void;
	now: () => Date;
	/** Reads a PDF by its manifest path. */
	readPdf: (file: string) => Promise<Uint8Array>;
	renderPages: (bytes: Uint8Array) => AsyncIterable<RenderedPage>;
	store: ArchiveStore;
}

interface ImportReport {
	checked: string[];
	created: string[];
	failed: { documentId: string; error: string }[];
	indexableBefore: string[];
	skipped: string[];
	withoutIntro: string[];
}

interface ImportRun {
	deps: ImportDependencies;
	dryRun: boolean;
	existing: Set<string>;
	report: ImportReport;
}

export { isSuccessful, runImport, summarize };
export type { ImportDependencies, ImportReport };
