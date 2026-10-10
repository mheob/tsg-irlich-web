import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';

import {
	getCoverPage,
	getCoverUrl,
	getFlipbookPages,
	getIssueYear,
	getPageSize,
	getPdfDownload,
} from './utils';
import type { EchoPageImage } from './utils';

// `@sanity/image-url` reads the project and the dataset from the client's config to build a URL.
vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
	} as unknown as typeof client,
}));

function pageImage(hash: string): EchoPageImage {
	return {
		_key: hash,
		_type: 'image' as const,
		asset: { _ref: `image-${hash}-1414x2000-jpg`, _type: 'reference' as const },
	};
}

describe('tsg-echo issue helpers', () => {
	it('reads the year from the release date', () => {
		expect(getIssueYear('2025-04-01')).toBe('2025');
	});

	it('has no year without a release date', () => {
		expect(getIssueYear(null)).toBe('');
	});

	it('offers the PDF as a download with its size', () => {
		expect(
			getPdfDownload({
				originalFilename: 'tsg-echo-2025.pdf',
				size: 12_582_912,
				url: 'https://cdn.sanity.io/files/p/d/abc.pdf',
			}),
		).toStrictEqual({
			href: 'https://cdn.sanity.io/files/p/d/abc.pdf?dl=tsg-echo-2025.pdf',
			size: '12.00 MB',
		});
	});

	// Review focus 5: a missing asset hides the button instead of linking to `#!`.
	it.each([
		['no PDF', null],
		['no url', { originalFilename: 'x.pdf', size: 1, url: null }],
		['no file name', { originalFilename: null, size: 1, url: 'https://cdn.sanity.io/x.pdf' }],
	])('offers no download for %s', (_label, pdf) => {
		expect(getPdfDownload(pdf)).toBeUndefined();
	});

	it('names every page after its position', () => {
		const pages = getFlipbookPages([pageImage('a'), pageImage('b'), pageImage('c')]);

		expect(pages.map((page) => page.alt)).toStrictEqual([
			'Seite 1 von 3',
			'Seite 2 von 3',
			'Seite 3 von 3',
		]);
	});

	it('offers every page in three widths and falls back to the largest', () => {
		const [page] = getFlipbookPages([pageImage('a')]);

		expect(page.srcSet.split(', ').map((entry) => entry.split(' ')[1])).toStrictEqual([
			'800w',
			'1200w',
			'1600w',
		]);
		expect(page.src).toContain('w=1600');
	});

	it('names the cover after the issue', () => {
		expect(getCoverPage(pageImage('a'), 'TSG ECHO 2025')?.alt).toBe('Titelseite von TSG ECHO 2025');
	});

	it('builds the cover in the width a card asks for', () => {
		expect(getCoverUrl({ _type: 'image', asset: pageImage('a').asset }, 600)).toContain('w=600');
	});

	it('has no cover URL without an asset', () => {
		expect(getCoverUrl({ _type: 'image', asset: null }, 600)).toBeUndefined();
	});

	it('has no cover without an image', () => {
		expect(getCoverPage(null, 'TSG ECHO 2025')).toBeUndefined();
	});

	it('takes the page size from the first page', () => {
		expect(getPageSize({ height: 2000, width: 1414 })).toStrictEqual({ height: 2000, width: 1414 });
	});

	// Review focus 5: an image without metadata still gets a book of a sensible shape.
	it('falls back to an A4 page without dimensions', () => {
		expect(getPageSize(null)).toStrictEqual({ height: 2000, width: 1414 });
	});
});
