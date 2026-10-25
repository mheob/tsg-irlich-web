import { describe, expect, it } from 'vite-plus/test';

import { groupRedirectQuery } from './offer-groups-group';

/**
 * Counts how often a text occurs in the query.
 *
 * @param query - The GROQ query.
 * @param text - The text to count.
 * @returns The number of occurrences.
 */
function countOccurrences(query: string, text: string): number {
	return query.split(text).length - 1;
}

describe('group redirect query', () => {
	// Every candidate is one `[0]` of an ordered list. Two groups that changed in the same
	// millisecond must not swap places between requests, so the id breaks the tie.
	it('picks the most recently updated group of each candidate and breaks a tie by id', () => {
		expect(countOccurrences(groupRedirectQuery, '| order(_updatedAt desc, _id asc) [0]')).toBe(3);
		expect(groupRedirectQuery).not.toContain('order(_updatedAt desc)');
	});

	// A group without a slug of its own would win the `[0]` and then be rejected as an incomplete
	// address, which hides a complete group of the same candidate behind it.
	it('only considers groups that have a slug in each candidate', () => {
		expect(countOccurrences(groupRedirectQuery, 'defined(slug.current)')).toBe(3);
	});

	it('only considers groups whose department has a slug in each candidate', () => {
		expect(countOccurrences(groupRedirectQuery, 'defined(department->slug.current)')).toBe(3);
	});
});
