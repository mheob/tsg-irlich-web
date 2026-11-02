// @vitest-environment node
import path from 'node:path';

import { describe, expect, it, vi } from 'vite-plus/test';
import type { Mock } from 'vite-plus/test';

import type { OcrEntry } from './manifest';
import type { OcrTools } from './ocrmypdf';
import { isSuccessful, runOcrSwap, summarize } from './run-ocr';
import type { OcrDependencies, OcrReport } from './run-ocr';
import type { RenderState, SwapStore, SwapTarget } from './swap-store';
import type { TextLayerDeps } from './text-layer';

const FOLDER = '/home/test/echo';
const OLD_PDF = 'file-1111111111111111111111111111111111111111-pdf';
const NEW_PDF = 'file-2222222222222222222222222222222222222222-pdf';
const SCAN: OcrEntry = {
	documentId: 'echo-archiv-1979-01',
	file: '1979 Erste Exemplare/1979_01.pdf',
};
const ISSUE_2024: OcrEntry = { documentId: 'echo-2024', file: 'ab 2024 (neues ECHO)/2024.pdf' };
const RERENDER =
	'Die PDF ist schon getauscht, aber ihr Render ist nicht fertig. Im Studio „Seiten neu erzeugen“ wählen und das Skript erneut starten.';

/**
 * A target as the store finds it.
 *
 * @param documentId - The published id.
 * @param overrides - Fields to replace.
 * @returns The target.
 */
function target(documentId: string, overrides: Partial<SwapTarget> = {}): SwapTarget {
	return {
		documentId,
		id: `drafts.${documentId}`,
		kind: 'draft',
		pdf: { assetId: OLD_PDF, originalFilename: `${documentId}.pdf`, sha1hash: 'old-hash' },
		render: { pdfRef: OLD_PDF, source: OLD_PDF, status: 'done', textLength: 0 },
		rev: 'rev-1',
		...overrides,
	};
}

const DONE: RenderState = { pdfRef: NEW_PDF, source: NEW_PDF, status: 'done', textLength: 18_023 };

/**
 * The run's dependencies over an in-memory archive. The scan has no text, 2024 has text
 * everywhere, and OCR turns the scan into a PDF with text; every PDF hashes to `hash-<first byte>`.
 *
 * @param targets - The target per document id; an id without one makes `findTarget` reject.
 * @returns The dependencies with spies.
 */
function createDeps(targets: Partial<Record<string, SwapTarget>>) {
	const files = new Map<string, Uint8Array>([
		[path.join(FOLDER, SCAN.file), new Uint8Array([1])],
		[path.join(FOLDER, ISSUE_2024.file), new Uint8Array([2])],
	]);
	const texts = new Map<number, string[]>([
		[1, ['']],
		[2, ['Vereinsthemen']],
		[3, ['Frischer Wind']],
	]);
	const log: string[] = [];
	const store: { [Method in keyof SwapStore]: Mock<SwapStore[Method]> } = {
		// oxlint-disable-next-line typescript/require-await -- the fake answers at once
		findTarget: vi.fn<SwapStore['findTarget']>(async (documentId) => {
			const found = targets[documentId];
			if (!found) {
				throw new Error(`Die Ausgabe ${documentId} gibt es nicht.`);
			}
			return found;
		}),
		readRender: vi.fn<SwapStore['readRender']>().mockResolvedValue(DONE),
		swapPdf: vi.fn<SwapStore['swapPdf']>().mockResolvedValue(),
		uploadPdf: vi.fn<SwapStore['uploadPdf']>().mockResolvedValue(NEW_PDF),
	};
	const tools: { [Method in keyof OcrTools]: Mock<OcrTools[Method]> } = {
		assertInstalled: vi.fn<OcrTools['assertInstalled']>().mockResolvedValue(),
		recognize: vi.fn<OcrTools['recognize']>(),
	};
	return {
		log,
		deps: {
			log: (line: string) => {
				log.push(line);
			},
			now: () => 0,
			sha1: (bytes: Uint8Array) => `hash-${bytes[0]}`,
			store,
			textLayer: {
				// oxlint-disable-next-line typescript/require-await -- the fake answers at once
				exists: async (file: string) => files.has(file),
				folder: FOLDER,
				makeDirectory: vi.fn<TextLayerDeps['makeDirectory']>().mockResolvedValue(),
				// oxlint-disable-next-line typescript/require-await -- the fake answers at once
				readFile: async (file: string) => {
					const found = files.get(file);
					if (!found) {
						throw new Error(`ENOENT: ${file}`);
					}
					return found;
				},
				// oxlint-disable-next-line typescript/require-await -- the fake answers at once
				readPageTexts: async (bytes: Uint8Array) => texts.get(bytes[0]) ?? [],
				// oxlint-disable-next-line typescript/require-await -- the fake answers at once
				recognize: async (_input: string, output: string) => {
					files.set(output, new Uint8Array([3]));
				},
			},
			tools,
			wait: vi.fn<OcrDependencies['wait']>().mockResolvedValue(),
		} satisfies OcrDependencies,
	};
}

describe('the text layer run', () => {
	it('checks the tools once before any entry when one needs OCR', async () => {
		const { deps } = createDeps({ [SCAN.documentId]: target(SCAN.documentId) });

		await runOcrSwap([SCAN, SCAN], deps, { dryRun: true });

		expect(deps.tools.assertInstalled).toHaveBeenCalledOnce();
		expect(deps.tools.assertInstalled).toHaveBeenCalledBefore(deps.store.findTarget);
	});

	it('does not check the tools when no entry needs OCR', async () => {
		const { deps } = createDeps({ [ISSUE_2024.documentId]: target(ISSUE_2024.documentId) });

		await runOcrSwap([ISSUE_2024], deps, { dryRun: true });

		expect(deps.tools.assertInstalled).not.toHaveBeenCalled();
	});

	it('touches no entry when the tools are missing', async () => {
		const { deps } = createDeps({ [SCAN.documentId]: target(SCAN.documentId) });
		deps.tools.assertInstalled.mockRejectedValue(new Error('OCRmyPDF fehlt.'));

		await expect(runOcrSwap([SCAN], deps, { dryRun: false })).rejects.toThrow('OCRmyPDF fehlt.');
		expect(deps.store.findTarget).not.toHaveBeenCalled();
	});

	it('only reports what it would swap in a dry run', async () => {
		const { deps, log } = createDeps({
			[ISSUE_2024.documentId]: target(ISSUE_2024.documentId, {
				id: 'echo-2024',
				kind: 'published',
			}),
			[SCAN.documentId]: target(SCAN.documentId),
		});

		const report = await runOcrSwap([SCAN, ISSUE_2024], deps, { dryRun: true });

		expect(report).toStrictEqual({
			checked: [SCAN.documentId, ISSUE_2024.documentId],
			failed: [],
			skipped: [],
			swapped: [],
		});
		expect(log).toStrictEqual([
			'echo-archiv-1979-01: 1 Seiten, erkannt, 12 Zeichen',
			'  würde getauscht (Entwurf)',
			'echo-2024: 1 Seiten, mit Textebene, 13 Zeichen',
			'  würde getauscht (neuer Entwurf)',
		]);
		expect(deps.store.uploadPdf).not.toHaveBeenCalled();
		expect(deps.store.swapPdf).not.toHaveBeenCalled();
	});

	it('uploads under the old file name, swaps and waits for the render', async () => {
		const scanTarget = target(SCAN.documentId);
		const { deps, log } = createDeps({ [SCAN.documentId]: scanTarget });

		const report = await runOcrSwap([SCAN], deps, { dryRun: false });

		expect(report.swapped).toStrictEqual([SCAN.documentId]);
		expect(deps.store.uploadPdf).toHaveBeenCalledWith(
			new Uint8Array([3]),
			'echo-archiv-1979-01.pdf',
		);
		expect(deps.store.swapPdf).toHaveBeenCalledWith(scanTarget, NEW_PDF);
		expect(deps.store.readRender).toHaveBeenCalledWith(scanTarget);
		expect(log.at(-1)).toBe('  Render fertig, extractedText 18023 Zeichen');
	});

	it('names the upload after the document when the old PDF has no name', async () => {
		const { deps } = createDeps({
			[SCAN.documentId]: target(SCAN.documentId, {
				pdf: { assetId: OLD_PDF, originalFilename: undefined, sha1hash: 'old-hash' },
			}),
		});

		await runOcrSwap([SCAN], deps, { dryRun: false });

		expect(deps.store.uploadPdf).toHaveBeenCalledWith(
			expect.any(Uint8Array),
			'echo-archiv-1979-01.pdf',
		);
	});

	it('skips an issue that already has this PDF and its pages', async () => {
		const { deps } = createDeps({
			[SCAN.documentId]: target(SCAN.documentId, {
				pdf: { assetId: NEW_PDF, originalFilename: 'x.pdf', sha1hash: 'hash-3' },
				render: DONE,
			}),
		});

		const report = await runOcrSwap([SCAN], deps, { dryRun: false });

		expect(report.skipped).toStrictEqual([SCAN.documentId]);
		expect(deps.store.uploadPdf).not.toHaveBeenCalled();
	});

	it('waits for a render still running from an earlier run', async () => {
		const swapped = {
			pdf: { assetId: NEW_PDF, originalFilename: 'x.pdf', sha1hash: 'hash-3' },
			render: { ...DONE, status: 'pending' as const },
		};
		const scanTarget = target(SCAN.documentId, swapped);
		const real = createDeps({ [SCAN.documentId]: scanTarget });
		const dry = createDeps({ [SCAN.documentId]: scanTarget });

		await expect(runOcrSwap([SCAN], real.deps, { dryRun: false })).resolves.toMatchObject({
			skipped: [SCAN.documentId],
		});
		await expect(runOcrSwap([SCAN], dry.deps, { dryRun: true })).resolves.toMatchObject({
			checked: [SCAN.documentId],
		});
		expect(real.deps.store.readRender).toHaveBeenCalledWith(scanTarget);
		expect(dry.deps.store.readRender).not.toHaveBeenCalled();
	});

	it.each([
		['a failed render', { ...DONE, error: 'kaputt', status: 'failed' as const }],
		['a render of another PDF', { ...DONE, source: OLD_PDF }],
		// The platform killed it before it could write `failed`; the clock of the run stands at 0.
		[
			'a render pending for over 15 minutes',
			{ ...DONE, startedAt: new Date(-900_001).toISOString(), status: 'pending' as const },
		],
	])('fails an already swapped issue with %s', async (_case, render) => {
		const { deps } = createDeps({
			[SCAN.documentId]: target(SCAN.documentId, {
				pdf: { assetId: NEW_PDF, originalFilename: 'x.pdf', sha1hash: 'hash-3' },
				render,
			}),
		});

		const report = await runOcrSwap([SCAN], deps, { dryRun: false });

		expect(report.failed).toStrictEqual([{ documentId: SCAN.documentId, error: RERENDER }]);
		expect(deps.store.readRender).not.toHaveBeenCalled();
	});

	it('fails an entry whose render fails and still runs the next one', async () => {
		const { deps, log } = createDeps({ [ISSUE_2024.documentId]: target(ISSUE_2024.documentId) });
		deps.store.readRender.mockResolvedValue({ ...DONE, error: 'kaputt', status: 'failed' });

		const report = await runOcrSwap([SCAN, ISSUE_2024], deps, { dryRun: false });

		expect(report.failed).toStrictEqual([
			{ documentId: SCAN.documentId, error: 'Die Ausgabe echo-archiv-1979-01 gibt es nicht.' },
			{ documentId: ISSUE_2024.documentId, error: 'Render gescheitert: kaputt' },
		]);
		expect(log).toContain('  Fehler: Die Ausgabe echo-archiv-1979-01 gibt es nicht.');
	});
});

describe('the text layer report', () => {
	const report: OcrReport = {
		checked: [],
		failed: [{ documentId: 'echo-2025', error: 'Render gescheitert: kaputt' }],
		skipped: ['echo-2024'],
		swapped: ['echo-archiv-1979-01'],
	};

	it('counts a run with a failure as unsuccessful', () => {
		expect(isSuccessful(report)).toBe(false);
		expect(isSuccessful({ ...report, failed: [] })).toBe(true);
	});

	it('sums up a real run and lists every failure', () => {
		expect(summarize(report, false)).toStrictEqual([
			'Getauscht: 1, übersprungen: 1, fehlgeschlagen: 1',
			'Fehlgeschlagen: echo-2025 (Render gescheitert: kaputt)',
		]);
	});

	it('sums up a dry run', () => {
		expect(
			summarize({ checked: ['a', 'b'], failed: [], skipped: [], swapped: [] }, true),
		).toStrictEqual(['Probelauf: 2 geprüft, übersprungen: 0, fehlgeschlagen: 0']);
	});
});
