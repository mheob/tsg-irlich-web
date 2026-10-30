import { describe, expect, it } from 'vite-plus/test';

import { SEARCH_MAX_LENGTH } from './constants';
import { getSearchWords, normalizeSearchInput, toTextQuery } from './query';

describe('the search input', () => {
	it('is trimmed and its whitespace collapsed to single spaces, newlines included', () => {
		expect(normalizeSearchInput('  Erste \n Mannschaft ')).toBe('Erste Mannschaft');
	});

	it('collapses tabs and non-breaking spaces as well', () => {
		expect(normalizeSearchInput('Erste\t Mannschaft')).toBe('Erste Mannschaft');
	});

	it('is cut to the maximum length', () => {
		const normalized = normalizeSearchInput('a'.repeat(150));

		expect(normalized).toHaveLength(100);
		expect(normalized).toHaveLength(SEARCH_MAX_LENGTH);
	});

	it('keeps an input of exactly the maximum length', () => {
		expect(normalizeSearchInput('a'.repeat(100))).toBe('a'.repeat(100));
	});

	it('does not end on a space after it was cut', () => {
		// "word " is five characters, so the hundredth character is a space.
		const normalized = normalizeSearchInput('word '.repeat(30));

		expect(normalized.endsWith(' ')).toBe(false);
		expect(normalized.length).toBeLessThanOrEqual(SEARCH_MAX_LENGTH);
	});

	it('does not cut an emoji in half', () => {
		// The emoji is two UTF-16 units, and the cut would fall between them. A lone surrogate makes
		// `encodeURIComponent` throw, which is how the term gets into the `/suche?q=` link.
		const normalized = normalizeSearchInput(`${'a'.repeat(99)}😀bbb`);

		expect(normalized).toBe('a'.repeat(99));
		expect(() => encodeURIComponent(normalized)).not.toThrow();
	});

	it('takes the first entry of a repeated search parameter', () => {
		expect(normalizeSearchInput(['a', 'b'])).toBe('a');
	});

	it('is empty for an empty list of entries', () => {
		expect(normalizeSearchInput([])).toBe('');
	});

	it('is empty for a missing search parameter', () => {
		// Next.js hands over `undefined` for an absent parameter, and the argument cannot be omitted
		// without a type error.
		// oxlint-disable-next-line unicorn/no-useless-undefined
		expect(normalizeSearchInput(undefined)).toBe('');
	});
});

describe('the words of a search input', () => {
	it('are lowercased and free of operator characters', () => {
		expect(getSearchWords('"Magic" -Diamonds* (Tanz)')).toStrictEqual([
			'magic',
			'diamonds',
			'tanz',
		]);
	});

	it('keep a dot, which is no operator', () => {
		expect(getSearchWords('1. Mannschaft')).toStrictEqual(['1.', 'mannschaft']);
	});

	it('keep the punctuation of a word that has a letter or a digit', () => {
		expect(getSearchWords('C++ Kurs')).toStrictEqual(['c++', 'kurs']);
	});

	it('leave out a word that is nothing but punctuation', () => {
		expect(getSearchWords('Tanz & Fitness')).toStrictEqual(['tanz', 'fitness']);
	});

	it.each(['"', '*', '-', '(', ')', '|', '~', '^'])(
		'lose the operator character %s',
		(operator) => {
			expect(getSearchWords(`${operator}Tanz${operator}`)).toStrictEqual(['tanz']);
		},
	);

	it('are separated by an operator character inside a word', () => {
		// "E-Jugend" has to find the pages that say "E-Jugend", so the hyphen splits instead of joining.
		expect(getSearchWords('E-Jugend')).toStrictEqual(['e', 'jugend']);
	});

	it('lowercase German letters', () => {
		expect(getSearchWords('ÜBUNG Straße')).toStrictEqual(['übung', 'straße']);
	});

	it.each(['', '   ', '-', '"*"', '()|~^', '..', '!!', '?!', '++', '...', '&'])(
		'are none in "%s"',
		(input) => {
			expect(getSearchWords(input)).toStrictEqual([]);
		},
	);
});

describe('the text query for Sanity', () => {
	it('searches the last word as a prefix', () => {
		expect(toTextQuery('Tanz')).toBe('tanz*');
	});

	it('joins several words and prefixes only the last one', () => {
		expect(toTextQuery('Erste Mannschaft')).toBe('erste mannschaft*');
	});

	it('leaves the operator characters out', () => {
		expect(toTextQuery('"Magic" -Diamonds*')).toBe('magic diamonds*');
	});

	it('is as short as the minimum length allows', () => {
		expect(toTextQuery('ab')).toBe('ab*');
	});

	it('counts the letters and digits of the words together, not each word', () => {
		expect(toTextQuery('a b')).toBe('a b*');
	});

	it('keeps the punctuation of a word that has a letter or a digit', () => {
		expect(toTextQuery('1. Mannschaft')).toBe('1. mannschaft*');
	});

	it('leaves out a word that is nothing but punctuation', () => {
		expect(toTextQuery('Tanz & Fitness')).toBe('tanz fitness*');
	});

	it.each(['a', '-', '"*"', '', '   ', '..', '!!', '?!', '++', '...', 'a.', '1.', 'a - !'])(
		'is undefined for "%s", so nothing is queried',
		(input) => {
			expect(toTextQuery(input)).toBeUndefined();
		},
	);
});
