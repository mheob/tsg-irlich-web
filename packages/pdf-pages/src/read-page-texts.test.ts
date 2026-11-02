import { describe, expect, it } from 'vite-plus/test';

import { createFixturePdf } from '../test-utils/create-fixture-pdf';
import { createScanPdf } from '../test-utils/create-scan-pdf';
import { createUnmappedTextPdf } from '../test-utils/create-unmapped-text-pdf';
import { readPageTexts } from './read-page-texts';

describe('page text reading', () => {
	it('returns the text of every page, in order', async () => {
		const pdf = await createFixturePdf(['Seite eins', 'Seite zwei']);

		await expect(readPageTexts(pdf)).resolves.toStrictEqual(['Seite eins', 'Seite zwei']);
	});

	it('returns an empty string for a scan without a text layer', async () => {
		const pdf = await createScanPdf();

		await expect(readPageTexts(pdf)).resolves.toStrictEqual(['']);
	});

	it('drops glyphs that their font maps to U+FFFD', async () => {
		const pdf = await createUnmappedTextPdf('XXXX Lesbar XX');

		const [text] = await readPageTexts(pdf);

		expect(text).toContain('Lesbar');
		expect(text).not.toContain('�');
	});

	it('leaves the caller’s buffer usable', async () => {
		const pdf = await createFixturePdf(['Zweimal']);

		await readPageTexts(pdf);

		await expect(readPageTexts(pdf)).resolves.toStrictEqual(['Zweimal']);
	});

	it('rejects when the data directory lacks the pdf.js data files', async () => {
		const pdf = await createFixturePdf(['Egal']);

		await expect(readPageTexts(pdf, { dataDir: '/nirgends' })).rejects.toThrow(
			'Die Daten von pdf.js fehlen unter /nirgends.',
		);
	});

	it('rejects bytes that are no PDF', async () => {
		await expect(readPageTexts(new Uint8Array([1, 2, 3]))).rejects.toThrow();
	});
});
