import { createCanvas } from '@napi-rs/canvas';
import type { Canvas, SKRSContext2D } from '@napi-rs/canvas';
import type { PDFDocumentProxy, PDFPageProxy, PageViewport } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { extractText, loadPdf } from './pdf-document';

const DEFAULT_MAX_EDGE = 2000;
const DEFAULT_QUALITY = 85;
const FIRST_PAGE = 1;
const ORIGIN = 0;
const PAPER = '#ffffff';
const UNIT_SCALE = 1;

/**
 * Creates a canvas covered in paper white. A transparent area would turn black in the JPEG.
 *
 * @param width - The width in pixels.
 * @param height - The height in pixels.
 * @returns The canvas and its 2D context.
 */
function createPaperCanvas(width: number, height: number): PaperCanvas {
	const canvas = createCanvas(width, height);
	const context = canvas.getContext('2d');
	context.fillStyle = PAPER;
	context.fillRect(ORIGIN, ORIGIN, width, height);
	return { canvas, context };
}

/**
 * Scales a page so that its longer edge has the given length.
 *
 * @param page - The page to scale.
 * @param maxEdge - The length of the longer edge in pixels.
 * @returns The scaled viewport.
 */
function fitViewport(page: PDFPageProxy, maxEdge: number): PageViewport {
	const base = page.getViewport({ scale: UNIT_SCALE });
	return page.getViewport({ scale: maxEdge / Math.max(base.width, base.height) });
}

/**
 * Renders one page and extracts its text.
 *
 * @param pdf - The loaded document.
 * @param index - The 1-based page number.
 * @param settings - The longest edge in pixels and the JPEG quality from 0 to 100.
 * @returns The rendered page.
 */
async function renderPage(
	pdf: PDFDocumentProxy,
	index: number,
	settings: RenderSettings,
): Promise<RenderedPage> {
	const page = await pdf.getPage(index);
	const viewport = fitViewport(page, settings.maxEdge);
	const width = Math.round(viewport.width);
	const height = Math.round(viewport.height);
	const { canvas, context } = createPaperCanvas(width, height);
	await page.render({
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- @napi-rs/canvas implements the subset pdf.js draws with
		canvas: canvas as unknown as HTMLCanvasElement,
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
		canvasContext: context as unknown as CanvasRenderingContext2D,
		viewport,
	}).promise;
	const jpeg = await canvas.encode('jpeg', settings.quality);
	const text = await extractText(page);
	page.cleanup();
	return { height, index, jpeg, text, width };
}

/**
 * Renders every page of a PDF to a JPEG and extracts its text, one page at a time, so that only a
 * single canvas is held in memory however long the PDF is.
 *
 * @param bytes - The PDF. pdf.js gets a copy, so the caller's buffer stays usable.
 * @param options - The longest edge in pixels and the JPEG quality.
 * @yields {RenderedPage} One rendered page after the other, numbered from 1.
 */
async function* renderPdfPages(
	bytes: Uint8Array,
	options: RenderOptions = {},
): AsyncGenerator<RenderedPage> {
	const settings: RenderSettings = {
		maxEdge: options.maxEdge ?? DEFAULT_MAX_EDGE,
		quality: options.quality ?? DEFAULT_QUALITY,
	};
	const loadingTask = await loadPdf(bytes, options.dataDir);

	try {
		const pdf = await loadingTask.promise;
		for (let index = FIRST_PAGE; index <= pdf.numPages; index++) {
			// One page at a time keeps a single canvas in memory, so the await stays in the loop.
			// oxlint-disable-next-line no-await-in-loop -- see above
			yield await renderPage(pdf, index, settings); // NOSONAR
		}
	} finally {
		// pdf.js 6 dropped `PDFDocumentProxy.destroy()`; the loading task tears down the document
		// and its in-process worker, also when loading failed.
		await loadingTask.destroy();
	}
}

interface RenderOptions {
	/** The pdfjs-dist directory with the data files. Default: resolved next to this package. */
	dataDir?: string;
	/** The longest edge of every image in pixels. Default: 2000. */
	maxEdge?: number;
	/** The JPEG quality from 0 to 100. Default: 85. */
	quality?: number;
}

interface RenderedPage {
	height: number;
	/** The 1-based page number. */
	index: number;
	jpeg: Uint8Array;
	/** The page's text layer; empty for a scan. */
	text: string;
	width: number;
}

type RenderSettings = Required<Omit<RenderOptions, 'dataDir'>>;

interface PaperCanvas {
	canvas: Canvas;
	context: SKRSContext2D;
}

export { renderPdfPages };
export type { RenderOptions, RenderedPage };
