import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vite-plus/test';

import { config, proxy } from './proxy';

// `@/lib/sanity/api` asserts the public Sanity variables when it is imported.
vi.mock(import('@/lib/sanity/api'), () => ({
	apiVersion: '2025-09-05',
	dataset: 'production',
	projectId: 'j4rxwl5m',
	studioUrl: 'http://localhost:3333',
}));

describe('the archive proxy', () => {
	it('only runs for the archive path', () => {
		expect(config.matcher).toBe('/echo-archiv/:path*');
	});

	// WEB-367: `headers()` in next.config.ts is dropped on external rewrites, a proxy's is not.
	it('hands an archive file to the Sanity CDN and keeps search engines away', () => {
		const response = proxy(
			new NextRequest('http://localhost/echo-archiv/images/0a1b2c-1414x2000.jpg?w=800'),
		);

		expect(response.headers.get('x-middleware-rewrite')).toBe(
			'https://cdn.sanity.io/images/j4rxwl5m/production/0a1b2c-1414x2000.jpg?w=800',
		);
		expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
	});

	it('answers anything else below the archive path with 404', () => {
		const response = proxy(new NextRequest('http://localhost/echo-archiv/images/a/b.jpg'));

		expect(response.status).toBe(404);
		expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
	});
});
