import { describe, expect, it } from 'vite-plus/test';

import { describeSpread } from './describe-spread';

describe('the page indicator', () => {
	it('names a single leaf', () => {
		expect(describeSpread([0], 52)).toBe('Seite 1 von 52');
	});

	it('names both leaves of a spread with an en dash', () => {
		expect(describeSpread([1, 2], 52)).toBe('Seiten 2–3 von 52');
	});

	// Review focus 4: a spread the engine reports with one leaf twice is still one page.
	it('never names a range of one page', () => {
		expect(describeSpread([4, 4], 5)).toBe('Seite 5 von 5');
	});

	it('says nothing before the book has loaded', () => {
		expect(describeSpread([], 0)).toBe('');
	});
});
