import { PDFDocument, PDFNumber, PDFOperator, PDFOperatorNames } from 'pdf-lib';

/** Width and height in pixels, and in PDF points, of the fixture scan. */
const SIZE = 400;

/**
 * A 400 × 400 all-black bitmap as CCITT group 4 data, the encoding of most black-and-white scans.
 * pdf.js decodes it through WebAssembly, which is what the fixture exercises.
 */
const BLACK_CCITT_G4 =
	'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
	'001001000b000001030001000000900100000101030001000000900100000201030001000000010000000301030001000000' +
	'040000000601030001000000010000001101040001000000080000001601030001000000900100001701040001000000350000' +
	'001a01050001000000c80000001b01050001000000d00000001c01030001000000010000000000000048000000010000004800' +
	'000001000000';

/**
 * Builds a one-page PDF that consists of a single black-and-white scan, without a text layer.
 *
 * @returns The PDF's bytes.
 */
export async function createScanPdf(): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const page = pdf.addPage([SIZE, SIZE]);
	const image = pdf.context.stream(Buffer.from(BLACK_CCITT_G4, 'hex'), {
		BitsPerComponent: 1,
		ColorSpace: 'DeviceGray',
		DecodeParms: { BlackIs1: true, Columns: SIZE, K: -1, Rows: SIZE },
		Filter: 'CCITTFaxDecode',
		Height: SIZE,
		Subtype: 'Image',
		Type: 'XObject',
		Width: SIZE,
	});
	const name = page.node.newXObject('Scan', pdf.context.register(image));
	page.pushOperators(
		PDFOperator.of(PDFOperatorNames.PushGraphicsState),
		PDFOperator.of(PDFOperatorNames.ConcatTransformationMatrix, [
			PDFNumber.of(SIZE),
			PDFNumber.of(0),
			PDFNumber.of(0),
			PDFNumber.of(SIZE),
			PDFNumber.of(0),
			PDFNumber.of(0),
		]),
		PDFOperator.of(PDFOperatorNames.DrawObject, [name]),
		PDFOperator.of(PDFOperatorNames.PopGraphicsState),
	);
	return pdf.save();
}
