import { createCanvas, loadImage } from '@napi-rs/canvas';
import { describe, expect, it } from 'vite-plus/test';

import { createFixturePdf } from '../test-utils/create-fixture-pdf';
import { renderPdfPages } from './render-pdf-pages';
import type { RenderOptions, RenderedPage } from './render-pdf-pages';

async function collect(pages: AsyncIterable<RenderedPage>): Promise<RenderedPage[]> {
	const result: RenderedPage[] = [];
	for await (const page of pages) {
		result.push(page);
	}
	return result;
}

async function renderFirstPage(pdf: Uint8Array, options?: RenderOptions): Promise<RenderedPage> {
	const [page] = await collect(renderPdfPages(pdf, options));
	if (page === undefined) {
		throw new Error('The PDF rendered no page.');
	}
	return page;
}

describe('pdf page rendering', () => {
	// Next.js' output tracing only ships the worker because it is imported statically; pdf.js then
	// has to find it in-process instead of importing it at runtime.
	it('registers the pdf.js worker in-process', () => {
		expect(Reflect.get(globalThis, 'pdfjsWorker')).toHaveProperty('WorkerMessageHandler');
	});

	it('yields one page per PDF page, in order and numbered from 1', async () => {
		const pdf = await createFixturePdf(['Seite eins', 'Seite zwei']);

		const pages = await collect(renderPdfPages(pdf));

		expect(pages.map((page) => page.index)).toStrictEqual([1, 2]);
	});

	it('scales the longer edge of an A4 page to 2000 px by default', async () => {
		const pdf = await createFixturePdf(['Hochformat']);

		const page = await renderFirstPage(pdf);

		expect(page).toMatchObject({ height: 2000, width: 1414 });
	});

	it('honours a custom longest edge', async () => {
		const pdf = await createFixturePdf(['Klein']);

		const page = await renderFirstPage(pdf, { maxEdge: 1000 });

		expect(page).toMatchObject({ height: 1000, width: 707 });
	});

	it('encodes every page as a JPEG', async () => {
		const pdf = await createFixturePdf(['JPEG']);

		const { jpeg } = await renderFirstPage(pdf);

		// Start of image and end of image marker
		expect(Buffer.from(jpeg.subarray(0, 3)).toString('hex')).toBe('ffd8ff');
		expect(Buffer.from(jpeg.subarray(-2)).toString('hex')).toBe('ffd9');
	});

	it('produces a smaller file at a lower quality', async () => {
		const pdf = await createFixturePdf(['Qualität']);

		const high = await renderFirstPage(pdf, { quality: 95 });
		const low = await renderFirstPage(pdf, { quality: 20 });

		expect(low.jpeg.length).toBeLessThan(high.jpeg.length);
	});

	// A transparent page area would come out black in a JPEG; the renderer fills it with paper white.
	it('paints the page on a white background', async () => {
		const pdf = await createFixturePdf(['Weiß']);
		const { jpeg } = await renderFirstPage(pdf, { maxEdge: 200 });
		const image = await loadImage(Buffer.from(jpeg));
		const canvas = createCanvas(image.width, image.height);
		const context = canvas.getContext('2d');
		context.drawImage(image, 0, 0);

		const pixel = context.getImageData(image.width - 2, image.height - 2, 1, 1).data;

		expect(Math.min(...pixel.subarray(0, 3))).toBeGreaterThanOrEqual(245);
	});

	it('extracts the text of every page', async () => {
		const pdf = await createFixturePdf(['Seite eins', 'Seite zwei']);

		const pages = await collect(renderPdfPages(pdf));

		expect(pages.map((page) => page.text)).toStrictEqual(['Seite eins', 'Seite zwei']);
	});

	it('keeps the line breaks of a page', async () => {
		const pdf = await createFixturePdf(['Zeile eins\nZeile zwei']);

		const { text } = await renderFirstPage(pdf);

		expect(text).toBe('Zeile eins\nZeile zwei');
	});

	it('rejects bytes that are not a PDF', async () => {
		const bytes = new TextEncoder().encode('Das ist keine PDF.');

		await expect(collect(renderPdfPages(bytes))).rejects.toThrow();
	});

	it('leaves the bytes it was given intact', async () => {
		const pdf = await createFixturePdf(['Unverändert']);
		const length = pdf.byteLength;

		await collect(renderPdfPages(pdf));

		expect(pdf.byteLength).toBe(length);
	});
});
