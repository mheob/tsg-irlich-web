import { describe, expect, it } from 'vitest';

import { formatDate } from './time';

describe('date formatting', () => {
	// `formatDate` calls `toISOString()`, which always renders UTC by specification, so it is
	// timezone-independent — no TZ stubbing is needed for these fixtures.

	it('formats a Date as a two digit year date', () => {
		expect(formatDate(new Date('2026-08-25T10:00:00.000Z'))).toBe('26-08-25');
	});

	it('formats an ISO string', () => {
		expect(formatDate('2026-01-01T00:00:00.000Z')).toBe('26-01-01');
	});

	it('formats a plain date string', () => {
		expect(formatDate('2026-12-31')).toBe('26-12-31');
	});

	it('uses UTC, so a UTC timestamp keeps its calendar day', () => {
		expect(formatDate('2026-08-25T23:30:00.000Z')).toBe('26-08-25');
	});
});
