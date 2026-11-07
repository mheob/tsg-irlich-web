import { describe, expect, it } from 'vite-plus/test';

import { printGoogleMapsLink } from './google-maps';

const GOOGLE_MAPS_PREFIX = 'https://www.google.com/maps/search/?api=1&query=';

const VENUE = {
	city: 'Neuwied',
	houseNumber: '12',
	name: 'Sporthalle Irlich',
	street: 'Pappelweg',
	zipCode: '56567',
};

describe('google maps link', () => {
	it('builds a search URL from the full address', () => {
		expect(printGoogleMapsLink(VENUE)).toBe(
			`${GOOGLE_MAPS_PREFIX}${encodeURIComponent('Sporthalle Irlich, Pappelweg 12, 56567 Neuwied')}`,
		);
	});

	it('skips an empty venue name', () => {
		expect(printGoogleMapsLink({ ...VENUE, name: '' })).toBe(
			`${GOOGLE_MAPS_PREFIX}${encodeURIComponent('Pappelweg 12, 56567 Neuwied')}`,
		);
	});

	it('skips an empty zip code', () => {
		expect(printGoogleMapsLink({ ...VENUE, zipCode: '' })).toBe(
			`${GOOGLE_MAPS_PREFIX}${encodeURIComponent('Sporthalle Irlich, Pappelweg 12, Neuwied')}`,
		);
	});
});
