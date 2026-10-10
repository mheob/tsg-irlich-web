// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { parseManifest, toDocumentId } from './manifest';

const ENTRY = {
	datei: '1979 Erste Exemplare/1979_01.pdf',
	erscheinungsdatum: '1979-03-01',
	titel: 'TSG ECHO 1979 Nr. 1',
};

describe('document ids', () => {
	it.each([
		['1979 Erste Exemplare/1979_01.pdf', 'echo-archiv-1979-01'],
		['1980-1989/1980 - TSG Irlich - 3.Echo.pdf', 'echo-archiv-1980-tsg-irlich-3-echo'],
		[
			'1980-1989/1982 - TSG Irlich - 2.Echo - 100 Jahre TSG Irlich.pdf',
			'echo-archiv-1982-tsg-irlich-2-echo-100-jahre-tsg-irlich',
		],
		['2000-2012/2012_03.PDF', 'echo-archiv-2012-03'],
	])('derives the id of %s from its file name', (file, id) => {
		expect(toDocumentId(file)).toBe(id);
	});
});

describe('the manifest', () => {
	it('turns an entry into a plan with id, slug, date and file', () => {
		expect(parseManifest([ENTRY])).toStrictEqual([
			{
				documentId: 'echo-archiv-1979-01',
				file: '1979 Erste Exemplare/1979_01.pdf',
				releaseDate: '1979-03-01',
				slug: 'tsg-echo-1979-nr-1',
				title: 'TSG ECHO 1979 Nr. 1',
			},
		]);
	});

	it('slugs the title of the anniversary issue like the studio does', () => {
		const [plan] = parseManifest([
			{ ...ENTRY, titel: 'TSG ECHO 1982 Nr. 2 – 100 Jahre TSG Irlich' },
		]);

		expect(plan.slug).toBe('tsg-echo-1982-nr-2-100-jahre-tsg-irlich');
	});

	it('trims the title', () => {
		expect(parseManifest([{ ...ENTRY, titel: '  TSG ECHO 1979 Nr. 1 ' }])[0]?.title).toBe(
			'TSG ECHO 1979 Nr. 1',
		);
	});

	// Review focus 2: nothing outside the folder, nothing that is not a PDF.
	it.each([
		['a path leaving the folder', '../geheim.pdf'],
		['a nested path leaving the folder', '1979/../../geheim.pdf'],
		['an absolute path', '/etc/passwd.pdf'],
		['another file type', '1979_01.docx'],
		['a name without letters or digits', '1979/---.pdf'],
	])('rejects %s', (_label, datei) => {
		expect(() => parseManifest([{ ...ENTRY, datei }])).toThrow('Die manifest.json ist ungültig');
	});

	it.each([
		['an impossible date', { ...ENTRY, erscheinungsdatum: '1979-02-30' }],
		['a date with a time', { ...ENTRY, erscheinungsdatum: '1979-03-01T10:00:00Z' }],
		['an empty title', { ...ENTRY, titel: ' ' }],
	])('rejects %s', (_label, entry) => {
		expect(() => parseManifest([entry])).toThrow('Die manifest.json ist ungültig');
	});

	it('rejects an empty list and anything that is not a list', () => {
		expect(() => parseManifest([])).toThrow('Die manifest.json ist ungültig');
		expect(() => parseManifest({ datei: 'x.pdf' })).toThrow('Die manifest.json ist ungültig');
	});

	// Two files with the same name in different folders would become one document.
	it('rejects two entries that give the same document id', () => {
		expect(() =>
			parseManifest([
				ENTRY,
				{ ...ENTRY, datei: 'Kopie/1979_01.pdf', titel: 'TSG ECHO 1979 Nr. 9' },
			]),
		).toThrow(
			'Doppelte Dokument-IDs (aus dem Dateinamen) in der manifest.json: echo-archiv-1979-01',
		);
	});

	it('rejects two entries that give the same slug', () => {
		expect(() => parseManifest([ENTRY, { ...ENTRY, datei: '1979_02.pdf' }])).toThrow(
			'Doppelte Slugs (aus dem Titel) in der manifest.json: tsg-echo-1979-nr-1',
		);
	});
});
