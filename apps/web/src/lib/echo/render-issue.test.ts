import { describe, expect, it, vi } from 'vite-plus/test';
import type { Mock } from 'vite-plus/test';

import type { RenderedPage } from '@tsgi-web/pdf-pages';

import { RenderError } from './render-error';
import { claimRender, runRender } from './render-issue';
import type { RenderDependencies, RenderJob } from './render-issue';
import type { EchoRenderState, EchoRenderStore, WriteOutcome } from './render-store';

const HASH = '8c3211369d3d2da0c150d50d7cb5bca911b15f5e';
const PDF_REF = `file-${HASH}-pdf`;
const LOCATION = { dataset: 'development', projectId: 'j4rxwl5m' };
const JOB: RenderJob = {
	id: 'drafts.echo-2025',
	pdfRef: PDF_REF,
	startedAt: '2026-10-10T10:00:00.000Z',
};

function state(overrides: Partial<EchoRenderState> = {}): EchoRenderState {
	return {
		id: JOB.id,
		pdfRef: PDF_REF,
		renderSource: PDF_REF,
		renderStartedAt: JOB.startedAt,
		rev: 'rev-1',
		...overrides,
	};
}

function page(index: number, text = `Text ${index}`): RenderedPage {
	return { height: 2000, index, jpeg: new Uint8Array([index]), text, width: 1414 };
}

// oxlint-disable-next-line typescript/require-await -- stands in for the renderer, which awaits pdf.js
async function* pagesOf(...pages: RenderedPage[]): AsyncGenerator<RenderedPage> {
	for (const item of pages) {
		yield item;
	}
}

function rejectInvalidPdf(): never {
	throw new Error('Invalid PDF structure.');
}

function rejectPasswordProtected(): never {
	throw Object.assign(new Error('No password given'), { name: 'PasswordException' });
}

function rejectWithLongMessage(): never {
	throw new Error('x'.repeat(2000));
}

interface FakeStore {
	claim: Mock<EchoRenderStore['claim']>;
	fail: Mock<EchoRenderStore['fail']>;
	finish: Mock<EchoRenderStore['finish']>;
	read: Mock<EchoRenderStore['read']>;
	uploadPage: Mock<EchoRenderStore['uploadPage']>;
}

/**
 * An in-memory store. `read()` resolves to one entry of `reads` per call and repeats the last one;
 * every write method resolves to the entries of `writes` in turn, then to `written`.
 *
 * @param reads - The states `read()` returns, in order.
 * @param writes - The outcomes each write method returns, in order.
 * @returns The store, with every method a spy.
 */
function createStore(reads: (EchoRenderState | null)[], writes: WriteOutcome[] = []): FakeStore {
	const read = vi.fn<EchoRenderStore['read']>().mockResolvedValue(reads.at(-1) ?? null);
	for (const entry of reads.slice(0, -1)) {
		read.mockResolvedValueOnce(entry);
	}
	const claim = vi.fn<EchoRenderStore['claim']>().mockResolvedValue('written');
	const fail = vi.fn<EchoRenderStore['fail']>().mockResolvedValue('written');
	const finish = vi.fn<EchoRenderStore['finish']>().mockResolvedValue('written');
	for (const outcome of writes) {
		claim.mockResolvedValueOnce(outcome);
		fail.mockResolvedValueOnce(outcome);
		finish.mockResolvedValueOnce(outcome);
	}
	const uploadPage = vi
		.fn<EchoRenderStore['uploadPage']>()
		// oxlint-disable-next-line typescript/require-await -- names the asset after its file, as Sanity resolves it
		.mockImplementation(async (_jpeg, filename) => `image-${filename}`);
	return { claim, fail, finish, read, uploadPage };
}

function deps(
	store: EchoRenderStore,
	overrides: Partial<RenderDependencies> = {},
): RenderDependencies {
	return {
		downloadPdf: vi
			.fn<RenderDependencies['downloadPdf']>()
			.mockResolvedValue(new Uint8Array([0x25])),
		location: LOCATION,
		now: () => 0,
		renderPages: () => pagesOf(page(1), page(2)),
		store,
		wait: vi.fn<RenderDependencies['wait']>().mockResolvedValue(),
		...overrides,
	};
}

describe('claiming a render', () => {
	it('reports a document that no longer exists', async () => {
		const store = createStore([null]);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ status: 'missing' });
		expect(store.claim).not.toHaveBeenCalled();
	});

	it('ignores a delivery whose PDF has been replaced since', async () => {
		const store = createStore([
			state({ pdfRef: 'file-0000000000000000000000000000000000000000-pdf', renderSource: null }),
		]);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ status: 'stale' });
	});

	it('ignores a second delivery for a PDF that is already claimed', async () => {
		const store = createStore([state()]);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ status: 'duplicate' });
		expect(store.claim).not.toHaveBeenCalled();
	});

	it('claims a document whose render is missing and returns the job', async () => {
		const unclaimed = state({ renderSource: null });
		const store = createStore([unclaimed]);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ job: JOB, status: 'claimed' });
		expect(store.claim).toHaveBeenCalledWith(unclaimed, JOB.startedAt);
	});

	// Two deliveries raced; the other one won the revision check and renders.
	it('reports a lost race as a conflict', async () => {
		const store = createStore([state({ renderSource: null })], ['conflict']);

		await expect(
			claimRender(store, { id: JOB.id, pdfRef: PDF_REF }, JOB.startedAt),
		).resolves.toStrictEqual({ status: 'conflict' });
	});
});

describe('running a render', () => {
	it('downloads the PDF from the CDN url of its reference', async () => {
		const store = createStore([state()]);
		const dependencies = deps(store);

		await runRender(JOB, dependencies);

		expect(dependencies.downloadPdf).toHaveBeenCalledWith(
			`https://cdn.sanity.io/files/j4rxwl5m/development/${HASH}.pdf`,
		);
	});

	it('uploads every page and writes pages, text and page count', async () => {
		const store = createStore([state()]);

		const outcome = await runRender(
			JOB,
			deps(store, { now: () => Date.parse('2026-10-10T10:01:00.000Z') }),
		);

		expect(outcome).toBe('done');
		expect(store.uploadPage.mock.calls.map(([, filename]) => filename)).toStrictEqual([
			'echo-8c321136-seite-001.jpg',
			'echo-8c321136-seite-002.jpg',
		]);
		expect(store.finish).toHaveBeenCalledWith(state(), {
			extractedText: '--- Seite 1 ---\nText 1\n\n--- Seite 2 ---\nText 2',
			finishedAt: '2026-10-10T10:01:00.000Z',
			pageCount: 2,
			pages: [
				{
					_key: 'seite-1',
					_type: 'image',
					asset: { _ref: 'image-echo-8c321136-seite-001.jpg', _type: 'reference' },
				},
				{
					_key: 'seite-2',
					_type: 'image',
					asset: { _ref: 'image-echo-8c321136-seite-002.jpg', _type: 'reference' },
				},
			],
			startedAt: JOB.startedAt,
		});
	});

	it('fails with the message of a PDF that cannot be read', async () => {
		const store = createStore([state()]);

		const outcome = await runRender(JOB, deps(store, { renderPages: rejectInvalidPdf }));

		expect(outcome).toBe('failed');
		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({
				error: 'Die Seiten konnten nicht erzeugt werden: Invalid PDF structure.',
			}),
		);
		expect(store.finish).not.toHaveBeenCalled();
	});

	it('fails when the download fails', async () => {
		const store = createStore([state()]);
		const downloadPdf = vi
			.fn<RenderDependencies['downloadPdf']>()
			.mockRejectedValue(new RenderError('Die PDF konnte nicht geladen werden (HTTP 404).'));

		await runRender(JOB, deps(store, { downloadPdf }));

		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ error: 'Die PDF konnte nicht geladen werden (HTTP 404).' }),
		);
	});

	// Review focus 2: no partial page list may reach the document.
	it('fails without writing any pages when an upload breaks halfway', async () => {
		const store = createStore([state()]);
		store.uploadPage
			.mockResolvedValueOnce('image-1')
			.mockRejectedValueOnce(new Error('upload failed'));

		const outcome = await runRender(JOB, deps(store));

		expect(outcome).toBe('failed');
		expect(store.finish).not.toHaveBeenCalled();
		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ error: 'Die Seiten konnten nicht erzeugt werden: upload failed' }),
		);
	});

	// Review focus 1: an editor has to understand the message.
	it('explains a password-protected PDF', async () => {
		const store = createStore([state()]);

		await runRender(JOB, deps(store, { renderPages: rejectPasswordProtected }));

		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ error: 'Die PDF ist passwortgeschützt.' }),
		);
	});

	// A scan has no text layer; the field stays empty instead of listing page headings.
	it('leaves the text empty for a scan without a text layer', async () => {
		const store = createStore([state()]);

		await runRender(JOB, deps(store, { renderPages: () => pagesOf(page(1, ''), page(2, '')) }));

		expect(store.finish).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ extractedText: '', pageCount: 2 }),
		);
	});

	it('only lists the pages that carry text', async () => {
		const store = createStore([state()]);

		await runRender(JOB, deps(store, { renderPages: () => pagesOf(page(1, ''), page(2)) }));

		expect(store.finish).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ extractedText: '--- Seite 2 ---\nText 2' }),
		);
	});

	it('fails for a PDF without pages', async () => {
		const store = createStore([state()]);

		await runRender(JOB, deps(store, { renderPages: () => pagesOf() }));

		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({ error: 'Die PDF enthält keine Seiten.' }),
		);
	});

	it('stops at the time budget', async () => {
		const store = createStore([state()]);
		let clock = 0;
		const now = (): number => {
			clock += 400_000;
			return clock;
		};

		await runRender(JOB, deps(store, { now }));

		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({
				error: 'Zeitlimit überschritten: Die PDF konnte nicht vollständig verarbeitet werden.',
			}),
		);
	});

	it('fails for a reference that is not a PDF asset', async () => {
		const store = createStore([state({ pdfRef: 'image-abc-jpg' })]);

		await runRender({ ...JOB, pdfRef: 'image-abc-jpg' }, deps(store));

		expect(store.fail).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ error: 'Ungültige PDF-Referenz image-abc-jpg' }),
		);
	});

	it('cuts a long error message to 500 characters', async () => {
		const store = createStore([state()]);

		await runRender(JOB, deps(store, { renderPages: rejectWithLongMessage }));

		expect(store.fail.mock.calls[0]?.[1].error).toHaveLength(500);
	});

	// Review focus 3: a newer PDF owns the document now.
	it('discards the result when the PDF was replaced during the run', async () => {
		const store = createStore([
			state({ pdfRef: 'file-0000000000000000000000000000000000000000-pdf' }),
		]);

		await expect(runRender(JOB, deps(store))).resolves.toBe('discarded');
		expect(store.finish).not.toHaveBeenCalled();
	});

	// Review focus 3, and an editor clicking "Seiten neu erzeugen" while a run is busy.
	it('discards the result when a newer run claimed the same PDF meanwhile', async () => {
		const store = createStore([state({ renderStartedAt: '2026-10-10T10:05:00.000Z' })]);

		await expect(runRender(JOB, deps(store))).resolves.toBe('discarded');
		expect(store.finish).not.toHaveBeenCalled();
	});

	// Publishing deletes the draft and copies its claim into the published document.
	it('writes into the published document when the draft was published during the run', async () => {
		const published = state({ id: 'echo-2025' });
		const store = createStore([null, published]);

		await expect(runRender(JOB, deps(store))).resolves.toBe('done');
		expect(store.read.mock.calls.map(([id]) => id)).toStrictEqual([JOB.id, 'echo-2025']);
		expect(store.finish).toHaveBeenCalledWith(published, expect.anything());
	});

	it('discards the result when the document was deleted during the run', async () => {
		const store = createStore([null]);

		await expect(runRender(JOB, deps(store))).resolves.toBe('discarded');
	});

	it('reads again and retries when an editor changed the document meanwhile', async () => {
		const store = createStore(
			[state({ rev: 'rev-1' }), state({ rev: 'rev-2' })],
			['conflict', 'written'],
		);

		await expect(runRender(JOB, deps(store))).resolves.toBe('done');
		expect(store.finish.mock.calls.map(([written]) => written.rev)).toStrictEqual([
			'rev-1',
			'rev-2',
		]);
	});

	it('waits longer before every retry', async () => {
		const store = createStore([state()], ['conflict', 'conflict', 'conflict']);
		const dependencies = deps(store);

		await runRender(JOB, dependencies);

		expect(vi.mocked(dependencies.wait).mock.calls).toStrictEqual([[1000], [2000]]);
	});

	// Review focus 1: a Sanity outage while writing back must not leave the run pending.
	it('records the failure when writing the result breaks', async () => {
		const store = createStore([state()]);
		store.finish.mockRejectedValueOnce(new Error('Sanity antwortet nicht'));

		await expect(runRender(JOB, deps(store))).resolves.toBe('failed');
		expect(store.fail).toHaveBeenCalledWith(
			state(),
			expect.objectContaining({
				error: 'Die Seiten konnten nicht erzeugt werden: Sanity antwortet nicht',
			}),
		);
	});

	it('gives up after three conflicts', async () => {
		const store = createStore([state()], ['conflict', 'conflict', 'conflict']);

		await expect(runRender(JOB, deps(store))).resolves.toBe('conflict');
		expect(store.finish).toHaveBeenCalledTimes(3);
	});
});
