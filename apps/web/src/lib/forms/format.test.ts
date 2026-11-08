import { describe, expect, it } from 'vite-plus/test';

import { formatEventDate, formatShortDate } from './format';

describe('date formatting', () => {
	it('formats the event date in Europe/Berlin', () => {
		expect(formatEventDate('2027-05-14T11:00:00Z')).toBe('Fr., 14.05.2027, 13:00 Uhr');
	});

	it('formats the event date in winter time', () => {
		expect(formatEventDate('2027-01-15T11:00:00Z')).toBe('Fr., 15.01.2027, 12:00 Uhr');
	});

	it('writes midnight as 00:00', () => {
		expect(formatEventDate('2027-05-13T22:00:00Z')).toBe('Fr., 14.05.2027, 00:00 Uhr');
	});

	it('formats the short date in Europe/Berlin', () => {
		expect(formatShortDate('2027-04-30T22:30:00Z')).toBe('01.05.2027');
	});

	it('keeps a plain date on its day', () => {
		expect(formatShortDate('2027-05-14')).toBe('14.05.2027');
	});
});
