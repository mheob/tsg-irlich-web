import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { extractText, loadPdf } from './pdf-document';

const FIRST_PAGE = 1;

/**
 * Reads the text of one page and frees what pdf.js kept for it.
 *
 * @param pdf - The loaded document.
 * @param index - The 1-based page number.
 * @returns The page's text, empty for a page without a text layer.
 */
async function readPageText(pdf: PDFDocumentProxy, index: number): Promise<string> {
	const page = await pdf.getPage(index);
	const text = await extractText(page);
	page.cleanup();
	return text;
}

/**
 * Reads the text layer of every page without rendering it, to find the pages a scan left without
 * text.
 *
 * @param bytes - The PDF. pdf.js gets a copy, so the caller's buffer stays usable.
 * @param options - The pdfjs-dist directory with the data files.
 * @returns One text per page, in page order, empty for a page without text.
 * @throws {Error} When the data files are missing or pdf.js cannot read the PDF.
 */
async function readPageTexts(bytes: Uint8Array, options: TextOptions = {}): Promise<string[]> {
	const loadingTask = await loadPdf(bytes, options.dataDir);

	try {
		const pdf = await loadingTask.promise;
		const indexes = Array.from({ length: pdf.numPages }, (_, offset) => FIRST_PAGE + offset);
		// Without a canvas a page holds only its text, so every page can be read at once.
		return await Promise.all(indexes.map(async (index) => readPageText(pdf, index)));
	} finally {
		await loadingTask.destroy();
	}
}

interface TextOptions {
	/** The pdfjs-dist directory with the data files. Default: resolved next to this package. */
	dataDir?: string;
}

export { readPageTexts };
export type { TextOptions };
