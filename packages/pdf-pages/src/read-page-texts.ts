import { extractText, loadPdf } from './pdf-document';

const FIRST_PAGE = 1;

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
		const texts: string[] = [];
		for (let index = FIRST_PAGE; index <= pdf.numPages; index++) {
			// oxlint-disable-next-line no-await-in-loop -- pdf.js hands out one page after the other
			const page = await pdf.getPage(index);
			// oxlint-disable-next-line no-await-in-loop -- see above
			texts.push(await extractText(page));
			page.cleanup();
		}
		return texts;
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
