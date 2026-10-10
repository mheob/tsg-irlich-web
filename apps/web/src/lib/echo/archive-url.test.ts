import { describe, expect, it } from 'vite-plus/test';

import { toArchiveUrl, toCdnUrl } from './archive-url';

const IMAGE =
	'https://cdn.sanity.io/images/j4rxwl5m/development/0a1b2c-1414x2000.jpg?w=800&fit=max&q=85';

describe('archive urls', () => {
	it('moves a page image below the archive path and keeps its parameters', () => {
		expect(toArchiveUrl(IMAGE)).toBe('/echo-archiv/images/0a1b2c-1414x2000.jpg?w=800&fit=max&q=85');
	});

	// Review focus 2: an archive file name like "1980 - TSG Irlich - 3.Echo.pdf".
	it('keeps the download name of a pdf, encoded', () => {
		expect(
			toArchiveUrl(
				'https://cdn.sanity.io/files/j4rxwl5m/production/9f8e.pdf?dl=1980 - TSG Irlich - 3.Echo.pdf',
			),
		).toBe('/echo-archiv/files/9f8e.pdf?dl=1980%20-%20TSG%20Irlich%20-%203.Echo.pdf');
	});

	// An encoded download name must survive the move below the archive path unchanged.
	it('keeps an already encoded download name as it is', () => {
		expect(
			toArchiveUrl(
				'https://cdn.sanity.io/files/j4rxwl5m/production/9f8e.pdf?dl=a%20%26%20b%20%231.pdf',
			),
		).toBe('/echo-archiv/files/9f8e.pdf?dl=a%20%26%20b%20%231.pdf');
	});

	// Review focus 3.
	it.each([
		['a relative path', '/verein/echo'],
		['another host', 'https://example.com/images/p/d/a.jpg'],
		['an unexpected depth', 'https://cdn.sanity.io/images/p/d/extra/a.jpg'],
		['no url at all', '#!'],
	])('leaves %s alone', (_label, url) => {
		expect(toArchiveUrl(url)).toBe(url);
	});
});

describe('the cdn url behind an archive path', () => {
	const TARGET = { dataset: 'production', projectId: 'j4rxwl5m' };

	// A link the archive builds must lead somewhere, whatever case the uploaded file name had.
	it.each([
		'https://cdn.sanity.io/images/j4rxwl5m/production/0a1b2c-1414x2000.jpg?w=800&fit=max',
		'https://cdn.sanity.io/files/j4rxwl5m/production/9f8e.PDF?dl=ALT.PDF',
	])('finds its way back from the archive link of %s', (cdnUrl) => {
		const archiveUrl = new URL(toArchiveUrl(cdnUrl), 'http://localhost');

		expect(toCdnUrl(archiveUrl.pathname, archiveUrl.search, TARGET)).toBe(cdnUrl);
	});

	it('points an archive image back at the Sanity CDN with its parameters', () => {
		expect(toCdnUrl('/echo-archiv/images/0a1b2c-1414x2000.jpg', '?w=800', TARGET)).toBe(
			'https://cdn.sanity.io/images/j4rxwl5m/production/0a1b2c-1414x2000.jpg?w=800',
		);
	});

	it('points an archive pdf back at the Sanity CDN with its download name', () => {
		expect(toCdnUrl('/echo-archiv/files/9f8e.pdf', '?dl=test.pdf', TARGET)).toBe(
			'https://cdn.sanity.io/files/j4rxwl5m/production/9f8e.pdf?dl=test.pdf',
		);
	});

	// The proxy serves the assets from the club's own origin, where an SVG or HTML file could run
	// script, so only the formats the archive links pass.
	it.each([
		['an svg image', '/echo-archiv/images/a-10x10.svg'],
		['an html file', '/echo-archiv/files/a.html'],
		['another kind of asset', '/echo-archiv/videos/a.mp4'],
		['a nested path', '/echo-archiv/images/a/b.jpg'],
		['a path that climbs up', '/echo-archiv/images/..'],
		['the bare prefix', '/echo-archiv'],
	])('knows nothing behind %s', (_label, path) => {
		expect(toCdnUrl(path, '', TARGET)).toBeUndefined();
	});

	// Review focus 4.
	it.each([
		['without a project', { dataset: 'production' }],
		['without a dataset', { projectId: 'j4rxwl5m' }],
	])('knows nothing %s', (_label, target) => {
		expect(toCdnUrl('/echo-archiv/images/a-1x1.jpg', '', target)).toBeUndefined();
	});
});
