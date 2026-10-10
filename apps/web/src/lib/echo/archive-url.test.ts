import { describe, expect, it } from 'vite-plus/test';

import { getArchiveHeaders, getArchiveRewrites, toArchiveUrl } from './archive-url';

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

describe('the archive rewrite', () => {
	it('proxies both asset kinds to the configured project and dataset', () => {
		expect(getArchiveRewrites({ dataset: 'production', projectId: 'j4rxwl5m' })).toStrictEqual([
			{
				destination: 'https://cdn.sanity.io/:kind/j4rxwl5m/production/:file',
				source: '/echo-archiv/:kind(images|files)/:file',
			},
		]);
	});

	// Review focus 4.
	it.each([
		['without a project', { dataset: 'production' }],
		['without a dataset', { projectId: 'j4rxwl5m' }],
	])('builds nothing %s', (_label, target) => {
		expect(getArchiveRewrites(target)).toStrictEqual([]);
	});

	it('tells search engines to skip everything below the archive path', () => {
		expect(getArchiveHeaders()).toStrictEqual([
			{
				headers: [
					{ key: 'X-Robots-Tag', value: 'noindex, nofollow' },
					{ key: 'x-vercel-enable-rewrite-caching', value: '1' },
				],
				source: '/echo-archiv/:path*',
			},
		]);
	});
});
