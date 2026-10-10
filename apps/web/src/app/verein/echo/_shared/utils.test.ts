import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';

import {
	getCoverPage,
	getCoverUrl,
	getFlipbookPages,
	getIssueYear,
	getPageSize,
	getPdfDownload,
	toSanityImage,
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

	// Two blank pages of a scan share one image, so the flipbook keys its leaves by the array key.
	it('keys every page by its array key, not by its image', () => {
		const pages = getFlipbookPages([
			{ ...pageImage('a'), _key: 'first' },
			{ ...pageImage('a'), _key: 'second' },
		]);

		expect(pages.map((page) => page.id)).toStrictEqual(['first', 'second']);
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

	it('hands the image builder only a page with an asset', () => {
		expect(toSanityImage({ _type: 'image', asset: null })).toBeUndefined();
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

	describe('for an issue search engines must not find', () => {
		it('links every width of every page through the archive path', () => {
			const [page] = getFlipbookPages([pageImage('a')], false);

			expect(page.src).toMatch(/^\/echo-archiv\/images\/a-1414x2000\.jpg\?/u);
			expect(
				page.srcSet.split(', ').every((entry) => entry.startsWith('/echo-archiv/images/')),
			).toBe(true);
		});

		it('links the cover of the flipbook and of the cards through the archive path', () => {
			expect(getCoverPage(pageImage('a'), 'TSG ECHO 1984 Nr. 1', false)?.src).toMatch(
				/^\/echo-archiv\/images\//u,
			);
			expect(getCoverUrl(pageImage('a'), 600, false)).toMatch(/^\/echo-archiv\/images\/.*w=600/u);
		});

		it('offers the pdf through the archive path with its file name', () => {
			expect(
				getPdfDownload(
					{
						originalFilename: 'tsg-echo-1984-1.pdf',
						size: 1_048_576,
						url: 'https://cdn.sanity.io/files/p/d/abc.pdf',
					},
					false,
				),
			).toStrictEqual({
				href: '/echo-archiv/files/abc.pdf?dl=tsg-echo-1984-1.pdf',
				size: '1.00 MB',
			});
		});
	});

	// Review focus 1: today's issues, whose projection says `indexable: true`.
	it('keeps the cdn urls for an issue search engines may find', () => {
		const [page] = getFlipbookPages([pageImage('a')], true);

		expect(page.src).toMatch(/^https:\/\/cdn\.sanity\.io\/images\//u);
	});
});
