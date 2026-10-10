import { access } from 'node:fs/promises';
import path from 'node:path';

import { createCanvas } from '@napi-rs/canvas';
import type { Canvas, SKRSContext2D } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, PDFPageProxy, PageViewport } from 'pdfjs-dist/legacy/build/pdf.mjs';
// Under Node pdf.js runs its worker in-process and would import this file at runtime, which
// Next.js' output tracing never sees (the spike failed with "Setting up fake worker failed").
// Importing it statically ships the file, and evaluating it sets `globalThis.pdfjsWorker`, where
// pdf.js looks for an in-process worker first.
// oxlint-disable-next-line import/no-unassigned-import -- imported for that side effect only
import 'pdfjs-dist/legacy/build/pdf.worker.mjs';

/** A file every complete pdf.js data directory carries. */
const PROBE_FILE = path.join('wasm', 'openjpeg.wasm');

const DEFAULT_MAX_EDGE = 2000;
const DEFAULT_QUALITY = 85;
const FIRST_PAGE = 1;
const ORIGIN = 0;
const PAPER = '#ffffff';
const UNIT_SCALE = 1;

/**
 * Finds the pdfjs-dist directory next to this package. `process.getBuiltinModule` keeps bundlers
 * from rewriting the lookup (Turbopack turns `require.resolve` into a module id), which is also
 * why a Next.js route passes `dataDir` itself.
 *
 * @returns The absolute path of the pdfjs-dist package.
 */
function getDefaultDataDir(): string {
	const { createRequire } = process.getBuiltinModule('module');
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
	const found = await access(path.join(dataDir, PROBE_FILE)).then(
		() => true,
		() => false,
	);
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
 * Tells text items apart from the marked-content markers pdf.js can mix into a page's text.
 *
 * @param item - One entry of `getTextContent().items`.
 * @returns Whether the entry carries text.
 */
function isTextItem(item: TextContentItem): item is TextItem {
	return 'str' in item;
}

/**
 * Joins the text items of a page, keeping its line breaks and collapsing runs of spaces.
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
		.replaceAll(/[ \t]+/gu, ' ')
		.trim();
}

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
	const data = await getDataOptions(options.dataDir ?? getDefaultDataDir());
	const loadingTask = getDocument({ ...data, data: new Uint8Array(bytes), verbosity: 0 });

	try {
		const pdf = await loadingTask.promise;
		for (let index = FIRST_PAGE; index <= pdf.numPages; index++) {
			// oxlint-disable-next-line no-await-in-loop -- one page at a time keeps a single canvas in memory
			yield await renderPage(pdf, index, settings);
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

type PdfjsDataOptions = Record<'cMapUrl' | 'iccUrl' | 'standardFontDataUrl' | 'wasmUrl', string>;

interface PaperCanvas {
	canvas: Canvas;
	context: SKRSContext2D;
}

/** An entry of a page's text content: a text item or a marked-content marker. */
type TextContentItem = Awaited<ReturnType<PDFPageProxy['getTextContent']>>['items'][number];

/** A text item; pdf.js does not export the type from its entry point. */
type TextItem = Extract<TextContentItem, { str: string }>;

export { renderPdfPages };
export type { RenderOptions, RenderedPage };
