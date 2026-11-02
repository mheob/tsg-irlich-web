// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { parseOcrManifestText } from './manifest';

const SCAN = { datei: '1979 Erste Exemplare/1979_01.pdf', dokument: 'echo-archiv-1979-01' };
const ISSUE_2024 = {
	datei: 'ab 2024 (neues ECHO)/2024_TSG_Echo_45_Jahre_Web_Text.pdf',
	dokument: 'echo-2024',
};

/**
 * The list as the file would hold it.
 *
 * @param entries - The entries.
 * @returns The JSON text.
 */
function list(...entries: unknown[]): string {
	return JSON.stringify(entries);
}

describe('the text layer list', () => {
	it('reads every entry in order', () => {
		expect(parseOcrManifestText(list(SCAN, ISSUE_2024))).toStrictEqual([
			{ documentId: 'echo-archiv-1979-01', file: '1979 Erste Exemplare/1979_01.pdf' },
			{
				documentId: 'echo-2024',
				file: 'ab 2024 (neues ECHO)/2024_TSG_Echo_45_Jahre_Web_Text.pdf',
			},
		]);
	});

	it.each(['drafts.echo-2024', 'versions.tsg-echo-archiv.echo-2024', '', 'echo 2024'])(
		'refuses the document id %j',
		(dokument) => {
			expect(() => parseOcrManifestText(list({ ...ISSUE_2024, dokument }))).toThrow(
				/^Die ocr-manifest\.json ist ungültig:/u,
			);
		},
	);

	it.each(['../x.pdf', '/abs/x.pdf', 'x.txt'])('refuses the file %j', (datei) => {
		expect(() => parseOcrManifestText(list({ ...SCAN, datei }))).toThrow(
			/^Die ocr-manifest\.json ist ungültig:/u,
		);
	});

	it('refuses an empty list', () => {
		expect(() => parseOcrManifestText('[]')).toThrow(/^Die ocr-manifest\.json ist ungültig:/u);
	});

	it('refuses a file listed twice', () => {
		expect(() => parseOcrManifestText(list(SCAN, { ...ISSUE_2024, datei: SCAN.datei }))).toThrow(
			'Doppelte Dateien in der ocr-manifest.json: 1979 Erste Exemplare/1979_01.pdf',
		);
	});

	it('refuses a document listed twice', () => {
		expect(() =>
			parseOcrManifestText(list(SCAN, { ...ISSUE_2024, dokument: SCAN.dokument })),
		).toThrow('Doppelte Dokumente in der ocr-manifest.json: echo-archiv-1979-01');
	});

	it('refuses text that is no JSON without quoting it', () => {
		expect(() => parseOcrManifestText('{geheim')).toThrow(
			/^Die ocr-manifest\.json ist kein gültiges JSON\.$/u,
		);
	});
});
