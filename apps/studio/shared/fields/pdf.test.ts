import { describe, expect, it } from 'vite-plus/test';

import { validatePdfFile } from './pdf';

describe('pdf file validation', () => {
	it('accepts an empty field, which Rule.required() reports instead', () => {
		expect(validatePdfFile()).toBe(true);
	});

	it('accepts a PDF', () => {
		expect(validatePdfFile({ asset: { mimeType: 'application/pdf' } })).toBe(true);
	});

	it('accepts an asset reference that does not carry a mime type yet', () => {
		expect(validatePdfFile({ asset: { _ref: 'file-abc-pdf' } })).toBe(true);
	});

	it('rejects any other mime type', () => {
		expect(validatePdfFile({ asset: { mimeType: 'image/png' } })).toBe(
			'Nur PDF-Dateien sind erlaubt',
		);
	});
});
