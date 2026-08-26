import { describe, expect, it } from 'vitest';

import { getLocaleDate } from '@/utils/time';

// Normalizes ICU whitespace so a future ICU update that swaps a plain space for a narrow
// no-break space (U+202F) or a no-break space (U+00A0) does not break the comparison.
function normalizeSpaces(value: string): string {
	return value.replaceAll(' ', ' ').replaceAll(' ', ' ');
}

// Midday UTC so no local timezone shifts the calendar day.
const NEW_YEAR = new Date('2024-01-01T12:00:00Z');
const SINGLE_DIGIT_DAY = new Date('2024-01-05T12:00:00Z');

describe('formatting a localized date', () => {
	it('formats the default long variant', () => {
		expect(normalizeSpaces(getLocaleDate(NEW_YEAR))).toBe(normalizeSpaces('1. Januar 2024'));
	});

	it('formats the short variant', () => {
		expect(normalizeSpaces(getLocaleDate(NEW_YEAR, 'short'))).toBe(normalizeSpaces('01.01.2024'));
	});

	it('formats an ISO string input the same as the equivalent Date', () => {
		expect(normalizeSpaces(getLocaleDate('2024-01-01T12:00:00Z', 'long'))).toBe(
			normalizeSpaces(getLocaleDate(NEW_YEAR, 'long')),
		);
	});

	it('changes the output for an explicit locale', () => {
		expect(normalizeSpaces(getLocaleDate(NEW_YEAR, 'long', 'en-US'))).toBe(
			normalizeSpaces('January 1, 2024'),
		);
	});

	it('keeps 2-digit padding for a single-digit day in the short variant', () => {
		expect(normalizeSpaces(getLocaleDate(SINGLE_DIGIT_DAY, 'short'))).toBe(
			normalizeSpaces('05.01.2024'),
		);
	});

	it('applies no padding for a single-digit day in the long variant', () => {
		expect(normalizeSpaces(getLocaleDate(SINGLE_DIGIT_DAY, 'long'))).toBe(
			normalizeSpaces('5. Januar 2024'),
		);
	});
});
