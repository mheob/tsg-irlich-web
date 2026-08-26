import { describe, expect, it } from 'vitest';

import type * as urlModule from '@/utils/url';

import { loadWithEnv } from '../../test-utils/env';

type UrlModule = typeof urlModule;

const GOOGLE_MAPS_PREFIX = 'https://www.google.com/maps/search/?api=1&query=';

const VENUE = {
	city: 'Neuwied',
	houseNumber: '12',
	name: 'Sporthalle Irlich',
	street: 'Pappelweg',
	zipCode: '56567',
};

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

describe('google maps link', () => {
	it('builds a search URL from the full address', async () => {
		const { printGoogleMapsLink } = await loadWithEnv<UrlModule>('@/utils/url', {});

		expect(printGoogleMapsLink(VENUE)).toBe(
			`${GOOGLE_MAPS_PREFIX}${encodeURIComponent('Sporthalle Irlich, Pappelweg 12, 56567 Neuwied')}`,
		);
	});

	it('skips an empty venue name', async () => {
		const { printGoogleMapsLink } = await loadWithEnv<UrlModule>('@/utils/url', {});

		expect(printGoogleMapsLink({ ...VENUE, name: '' })).toBe(
			`${GOOGLE_MAPS_PREFIX}${encodeURIComponent('Pappelweg 12, 56567 Neuwied')}`,
		);
	});

	it('skips an empty zip code', async () => {
		const { printGoogleMapsLink } = await loadWithEnv<UrlModule>('@/utils/url', {});

		expect(printGoogleMapsLink({ ...VENUE, zipCode: '' })).toBe(
			`${GOOGLE_MAPS_PREFIX}${encodeURIComponent('Sporthalle Irlich, Pappelweg 12, Neuwied')}`,
		);
	});
});
