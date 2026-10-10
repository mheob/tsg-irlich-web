import { PDFDocument, StandardFonts } from 'pdf-lib';

/** A4 in PDF points. */
const A4: [number, number] = [595.28, 841.89];
const FONT_SIZE = 24;
const LINE_HEIGHT = 30;
const MARGIN = 72;

/**
 * Builds a PDF with one A4 page per entry, each carrying its entry as real text, so the text layer
 * can be extracted again. A `\n` in an entry starts a new line.
 *
 * @param pages - The text of every page, in order.
 * @returns The PDF's bytes.
 */
export async function createFixturePdf(pages: readonly string[]): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	for (const text of pages) {
		const page = pdf.addPage(A4);
		page.drawText(text, {
			font,
			lineHeight: LINE_HEIGHT,
			size: FONT_SIZE,
			x: MARGIN,
			y: A4[1] - MARGIN,
		});
	}
	return pdf.save();
}
