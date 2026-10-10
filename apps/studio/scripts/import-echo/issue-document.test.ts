// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { buildIssueDocument, toPageEntry, toPageFilename, toPageText } from './issue-document';
import type { IssuePlan } from './manifest';

const PDF = 'file-8c3211369d3d2da0c150d50d7cb5bca911b15f5e-pdf';
const PLAN: IssuePlan = {
	documentId: 'echo-archiv-1984-tsg-irlich-1-echo',
	file: '1980-1989/1984 - TSG Irlich - 1.Echo.pdf',
	releaseDate: '1984-03-01',
	slug: 'tsg-echo-1984-nr-1',
	title: 'TSG ECHO 1984 Nr. 1',
};
const CONTENT = {
	extractedText: '--- Seite 1 ---\nText',
	finishedAt: '2026-10-11T10:05:00.000Z',
	intro: 'Ein Intro.',
	pages: [toPageEntry('image-a-1414x2000-jpg', 1)],
	pdfAssetId: PDF,
	startedAt: '2026-10-11T10:00:00.000Z',
};

describe('page images', () => {
	// The render route names its uploads the same way, so both kinds look alike in the media library.
	it('names a page after the pdf hash and its zero-padded number', () => {
		expect(toPageFilename(PDF, 7)).toBe('echo-8c321136-seite-007.jpg');
	});

	it('refuses an id that is not a pdf asset', () => {
		expect(() => toPageFilename('image-abc-1x1-jpg', 1)).toThrow('Ungültige PDF-Asset-ID');
	});

	it('keys a page entry by its number', () => {
		expect(toPageEntry('image-a-1414x2000-jpg', 3)).toStrictEqual({
			_key: 'seite-3',
			_type: 'image',
			asset: { _ref: 'image-a-1414x2000-jpg', _type: 'reference' },
		});
	});

	it('heads the text of a page like the render route', () => {
		expect(toPageText({ index: 2, text: 'Abteilungen' })).toBe('--- Seite 2 ---\nAbteilungen');
	});

	// A scan has no text layer; its pages add nothing to `extractedText`.
	it('adds nothing for a page without text', () => {
		expect(toPageText({ index: 2, text: '' })).toBeUndefined();
	});
});

describe('the issue document', () => {
	it('builds a finished, hidden issue whose render source is its own pdf', () => {
		expect(buildIssueDocument(PLAN, CONTENT)).toStrictEqual({
			_type: 'echo.issue',
			extractedText: '--- Seite 1 ---\nText',
			indexable: false,
			intro: 'Ein Intro.',
			pages: [toPageEntry('image-a-1414x2000-jpg', 1)],
			pdf: { _type: 'file', asset: { _ref: PDF, _type: 'reference' } },
			releaseDate: '1984-03-01',
			render: {
				finishedAt: '2026-10-11T10:05:00.000Z',
				pageCount: 1,
				source: PDF,
				startedAt: '2026-10-11T10:00:00.000Z',
				status: 'done',
			},
			slug: { _type: 'slug', current: 'tsg-echo-1984-nr-1' },
			title: 'TSG ECHO 1984 Nr. 1',
		});
	});

	// Without a draft the field stays empty for the editors, instead of holding an empty string.
	it('leaves the intro out when there is none', () => {
		expect(buildIssueDocument(PLAN, { ...CONTENT, intro: undefined })).not.toHaveProperty('intro');
	});
});
