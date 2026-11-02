// @vitest-environment node
import path from 'node:path';

import { describe, expect, it, vi } from 'vite-plus/test';

import { needsRecognition, prepareTextLayer } from './text-layer';
import type { TextLayerDeps } from './text-layer';

const FOLDER = '/home/test/echo';
const ENTRY = { documentId: 'echo-archiv-1979-01', file: '1979 Erste Exemplare/1979_01.pdf' };
const INPUT = path.join(FOLDER, ENTRY.file);
const OUTPUT = path.join(FOLDER, 'mit-textebene', ENTRY.file);

/**
 * A PDF the fake file system holds: its bytes and the text of each page.
 *
 * @param texts - The text of each page.
 * @returns The fake PDF.
 */
function pdf(...texts: string[]): FakePdf {
	return { bytes: new Uint8Array([texts.length]), texts };
}

/**
 * Text layer dependencies over an in-memory folder. `recognize` writes `recognized` to the output.
 *
 * @param files - The files by absolute path.
 * @param recognized - What OCR turns a scan into.
 * @returns The spies.
 */
function createDeps(files: Record<string, FakePdf>, recognized = pdf('Erkannt eins', 'zwei')) {
	const disk = new Map(Object.entries(files));
	const texts = new Map<Uint8Array, string[]>();
	for (const file of [...disk.values(), recognized]) {
		texts.set(file.bytes, file.texts);
	}
	// The fakes below answer at once, so they await nothing.
	return {
		// oxlint-disable-next-line typescript/require-await -- see above
		exists: vi.fn<TextLayerDeps['exists']>(async (file) => disk.has(file)),
		folder: FOLDER,
		makeDirectory: vi.fn<TextLayerDeps['makeDirectory']>().mockResolvedValue(),
		// oxlint-disable-next-line typescript/require-await -- see above
		readFile: vi.fn<TextLayerDeps['readFile']>(async (file) => {
			const found = disk.get(file);
			if (!found) {
				throw new Error(`ENOENT: ${file}`);
			}
			return found.bytes;
		}),
		// oxlint-disable-next-line typescript/require-await -- see above
		readPageTexts: vi.fn<TextLayerDeps['readPageTexts']>(async (bytes) => texts.get(bytes) ?? []),
		// oxlint-disable-next-line typescript/require-await -- see above
		recognize: vi.fn<TextLayerDeps['recognize']>(async (_input, output) => {
			disk.set(output, recognized);
		}),
	};
}

interface FakePdf {
	bytes: Uint8Array;
	texts: string[];
}

describe('the text layer', () => {
	it('takes an earlier result from mit-textebene as it is', async () => {
		const cached = pdf('Schon erkannt');
		const deps = createDeps({ [INPUT]: pdf(''), [OUTPUT]: cached });

		await expect(prepareTextLayer(ENTRY, deps)).resolves.toStrictEqual({
			bytes: cached.bytes,
			characters: 12,
			pageCount: 1,
			source: 'cached',
		});
		expect(deps.recognize).not.toHaveBeenCalled();
	});

	it('takes a PDF with text on every page unchanged', async () => {
		const original = pdf('Seite eins', 'Seite zwei');
		const deps = createDeps({ [INPUT]: original });

		await expect(prepareTextLayer(ENTRY, deps)).resolves.toStrictEqual({
			bytes: original.bytes,
			characters: 18,
			pageCount: 2,
			source: 'original',
		});
		expect(deps.recognize).not.toHaveBeenCalled();
		expect(deps.makeDirectory).not.toHaveBeenCalled();
	});

	it('recognizes a PDF with a page without text into mit-textebene', async () => {
		const recognized = pdf('Erkannt eins', 'zwei');
		const deps = createDeps({ [INPUT]: pdf('Anzeige', ' \n ') }, recognized);

		await expect(prepareTextLayer(ENTRY, deps)).resolves.toStrictEqual({
			bytes: recognized.bytes,
			characters: 15,
			pageCount: 2,
			source: 'recognized',
		});
		expect(deps.makeDirectory).toHaveBeenCalledWith(path.dirname(OUTPUT));
		expect(deps.recognize).toHaveBeenCalledWith(INPUT, OUTPUT);
	});

	it('refuses a PDF without pages', async () => {
		const deps = createDeps({ [INPUT]: pdf() });

		await expect(prepareTextLayer(ENTRY, deps)).rejects.toThrow('Die PDF enthält keine Seiten.');
	});

	it('needs recognition for a PDF with a page without text', async () => {
		const deps = createDeps({ [INPUT]: pdf('Text', '') });

		await expect(needsRecognition(ENTRY, deps)).resolves.toBe(true);
	});

	it('needs no recognition for a PDF with text on every page', async () => {
		const deps = createDeps({ [INPUT]: pdf('Text') });

		await expect(needsRecognition(ENTRY, deps)).resolves.toBe(false);
	});

	it('needs no recognition when an earlier result exists', async () => {
		const deps = createDeps({ [INPUT]: pdf(''), [OUTPUT]: pdf('Erkannt') });

		await expect(needsRecognition(ENTRY, deps)).resolves.toBe(false);
		expect(deps.readFile).not.toHaveBeenCalled();
	});
});
