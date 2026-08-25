import { describe, expect, it } from 'vitest';

import { capitalizeString, capitalizeWords } from './typography';

describe('capitalize a string', () => {
	it('capitalizes the first letter', () => {
		expect(capitalizeString('fußball')).toBe('Fußball');
	});

	it('leaves an already capitalized string alone', () => {
		expect(capitalizeString('Fußball')).toBe('Fußball');
	});

	it('returns an empty string for an empty input', () => {
		expect(capitalizeString('')).toBe('');
	});

	it('handles a single character', () => {
		expect(capitalizeString('a')).toBe('A');
	});

	it('keeps the rest of the string untouched', () => {
		expect(capitalizeString('kinderTURNEN')).toBe('KinderTURNEN');
	});
});

describe('capitalize words', () => {
	it('capitalizes every hyphen separated word', () => {
		expect(capitalizeWords('weitere-sportarten')).toBe('Weitere Sportarten');
	});

	it('lowercases the remainder of each word', () => {
		expect(capitalizeWords('WEITERE-SPORTARTEN')).toBe('Weitere Sportarten');
	});

	it('accepts a custom separator', () => {
		expect(capitalizeWords('weitere sportarten', ' ')).toBe('Weitere Sportarten');
	});

	it('returns an empty string for an empty input', () => {
		expect(capitalizeWords('')).toBe('');
	});

	it('handles a single word', () => {
		expect(capitalizeWords('taekwondo')).toBe('Taekwondo');
	});
});
