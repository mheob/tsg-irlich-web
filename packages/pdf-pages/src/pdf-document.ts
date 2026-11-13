import { access } from 'node:fs/promises';
import path from 'node:path';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentLoadingTask, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
// Under Node pdf.js runs its worker in-process and would import this file at runtime, which
// Next.js' output tracing never sees (the spike failed with "Setting up fake worker failed").
// Importing it statically ships the file, and evaluating it sets `globalThis.pdfjsWorker`, where
// pdf.js looks for an in-process worker first.
// oxlint-disable-next-line import/no-unassigned-import -- imported for that side effect only
import 'pdfjs-dist/legacy/build/pdf.worker.mjs';

/** A file every complete pdf.js data directory carries. */
const PROBE_FILE = path.join('wasm', 'openjpeg.wasm');

/**
 * Finds the pdfjs-dist directory next to this package. `process.getBuiltinModule` keeps bundlers
 * from rewriting the lookup (Turbopack turns `require.resolve` into a module id), which is also
 * why a Next.js route passes `dataDir` itself.
 *
 * @returns The absolute path of the pdfjs-dist package.
 */
function getDefaultDataDir(): string {
	const { createRequire } = process.getBuiltinModule('node:module');
	return path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'));
}

/**
 * Points pdf.js at its WebAssembly decoders, standard fonts, CMaps and ICC profiles, which it reads
 * from disk at runtime. Without the decoders it skips CCITT, JBIG2 and JPEG 2000 images silently,
 * which is how black-and-white scans are stored, and the page comes out blank.
 *
 * @param dataDir - The pdfjs-dist directory.
 * @returns The `getDocument` options for the data files.
 * @throws {Error} When the directory does not hold the pdf.js data files.
 */
async function getDataOptions(dataDir: string): Promise<PdfjsDataOptions> {
	const found = await access(path.join(dataDir, PROBE_FILE))
		.then(() => true)
		.catch(() => false);
	if (!found) {
		throw new Error(`Die Daten von pdf.js fehlen unter ${dataDir}.`);
	}
	const folder = (name: string): string => `${path.join(dataDir, name)}${path.sep}`;
	return {
		cMapUrl: folder('cmaps'),
		iccUrl: folder('iccs'),
		standardFontDataUrl: folder('standard_fonts'),
		wasmUrl: folder('wasm'),
	};
}

/**
 * Starts loading a PDF with the pdf.js data files. The caller destroys the returned task, which
 * tears down the document and its in-process worker, also when loading failed.
 *
 * @param bytes - The PDF. pdf.js gets a copy, so the caller's buffer stays usable.
 * @param dataDir - The pdfjs-dist directory. Default: resolved next to this package.
 * @returns The loading task.
 * @throws {Error} When the directory does not hold the pdf.js data files.
 */
async function loadPdf(bytes: Uint8Array, dataDir?: string): Promise<PDFDocumentLoadingTask> {
	const data = await getDataOptions(dataDir ?? getDefaultDataDir());
	return getDocument({ ...data, data: new Uint8Array(bytes), verbosity: 0 });
}

/**
 * Tells text items apart from the marked-content markers pdf.js can mix into a page's text.
 *
 * @param item - One entry of `getTextContent().items`.
 * @returns Whether the entry carries text.
 */
function isTextItem(item: TextContentItem): item is TextItem {
	return 'str' in item;
}

/**
 * Joins the text items of a page, keeping its line breaks and collapsing runs of spaces. Glyphs
 * that their font maps to U+FFFD carry no text and are dropped: some PDFs declare a whole font that
 * way, and the Sanity import refuses a dataset holding the character.
 *
 * @param page - The page to read.
 * @returns The page's text, empty for a scan without a text layer.
 */
async function extractText(page: PDFPageProxy): Promise<string> {
	const content = await page.getTextContent();
	return content.items
		.filter(isTextItem)
		.map((item) => `${item.str}${item.hasEOL ? '\n' : ' '}`)
		.join('')
		.replaceAll('�', '')
		.replaceAll(/[ \t]+/gu, ' ')
		.trim();
}

type PdfjsDataOptions = Record<'cMapUrl' | 'iccUrl' | 'standardFontDataUrl' | 'wasmUrl', string>;

/** An entry of a page's text content: a text item or a marked-content marker. */
type TextContentItem = Awaited<ReturnType<PDFPageProxy['getTextContent']>>['items'][number];

/** A text item; pdf.js does not export the type from its entry point. */
type TextItem = Extract<TextContentItem, { str: string }>;

export { extractText, loadPdf };
