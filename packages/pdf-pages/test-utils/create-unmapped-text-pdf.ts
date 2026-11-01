import { PDFDict, PDFDocument, PDFName, StandardFonts } from 'pdf-lib';

/** A4 in PDF points. */
const A4: [number, number] = [595.28, 841.89];
const FONT_SIZE = 24;
const LINE_HEIGHT = 30;
const MARGIN = 72;

/**
 * A ToUnicode CMap that declares the glyph of `X` as U+FFFD, the replacement character. Some PDF
 * producers write that for glyphs they cannot name, as the TSG-Echo issues of 2012 do for their
 * Arial subsets.
 */
const X_AS_REPLACEMENT_CHARACTER = `/CIDInit /ProcSet findresource begin
12 dict begin
begincmap
/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def
/CMapName /Adobe-Identity-UCS def
/CMapType 2 def
1 begincodespacerange
<00> <FF>
endcodespacerange
1 beginbfchar
<58> <FFFD>
endbfchar
endcmap
CMapName currentdict /CMapResource defineresource pop
end
end`;

/**
 * Builds a one-page PDF whose font maps every `X` to U+FFFD, so pdf.js reports a replacement
 * character for it. A `\n` in the text starts a new line.
 *
 * @param text - The text of the page.
 * @returns The PDF's bytes.
 */
export async function createUnmappedTextPdf(text: string): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	pdf.addPage(A4).drawText(text, {
		font,
		lineHeight: LINE_HEIGHT,
		size: FONT_SIZE,
		x: MARGIN,
		y: A4[1] - MARGIN,
	});
	// The font dictionary only exists once pdf-lib has embedded the font.
	await pdf.flush();
	const toUnicode = pdf.context.register(pdf.context.stream(X_AS_REPLACEMENT_CHARACTER));
	pdf.context.lookup(font.ref, PDFDict).set(PDFName.of('ToUnicode'), toUnicode);
	return pdf.save();
}
