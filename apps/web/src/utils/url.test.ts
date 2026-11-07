import { describe, expect, it } from 'vite-plus/test';

import type * as urlModule from '@/utils/url';

import { loadWithEnv } from '../../test-utils/env';

type UrlModule = typeof urlModule;

describe('base url', () => {
	it('prefers the Vercel production URL', async () => {
		const { getBaseUrl } = await loadWithEnv<UrlModule>('@/utils/url', {
			NODE_ENV: 'production',
			VERCEL_PROJECT_PRODUCTION_URL: 'tsg-irlich.vercel.app',
		});

		expect(getBaseUrl()).toBe('https://tsg-irlich.vercel.app');
	});

	it('falls back to the live domain in production', async () => {
		const { getBaseUrl } = await loadWithEnv<UrlModule>('@/utils/url', {
			NODE_ENV: 'production',
			VERCEL_PROJECT_PRODUCTION_URL: undefined,
		});

		expect(getBaseUrl()).toBe('https://www.tsg-irlich.de');
	});

	it('falls back to localhost outside production', async () => {
		const { getBaseUrl } = await loadWithEnv<UrlModule>('@/utils/url', {
			NODE_ENV: 'development',
			VERCEL_PROJECT_PRODUCTION_URL: undefined,
		});

		expect(getBaseUrl()).toBe('http://localhost:3000');
	});
});
