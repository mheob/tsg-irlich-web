import { describe, expect, it } from 'vite-plus/test';

import {
	normalizeLineSpacing,
	normalizeTextSpacing,
	validateLineSpacing,
	validateTextSpacing,
} from './whitespace';

describe('normalizing a single line', () => {
	it('trims the ends', () => {
		expect(normalizeLineSpacing('  Melanie Klein ')).toBe('Melanie Klein');
	});

	it('collapses every run of whitespace into one space', () => {
		expect(normalizeLineSpacing('Melanie  Klein')).toBe('Melanie Klein');
		expect(normalizeLineSpacing('TSG\tverliert\n1:4')).toBe('TSG verliert 1:4');
	});

	it('keeps a non-breaking space, which an editor sets on purpose', () => {
		expect(normalizeLineSpacing('1.\u00A0Mannschaft')).toBe('1.\u00A0Mannschaft');
	});

	it('leaves a clean value as it is', () => {
		expect(normalizeLineSpacing('Heimsieg gegen Engers')).toBe('Heimsieg gegen Engers');
	});
});

describe('normalizing a multi-line text', () => {
	it('trims the ends and collapses runs of spaces', () => {
		expect(normalizeTextSpacing(' Erster Satz.  Zweiter Satz. ')).toBe(
			'Erster Satz. Zweiter Satz.',
		);
	});

	it('keeps line breaks, but not the spaces around them', () => {
		expect(normalizeTextSpacing('Erste Zeile \n  Zweite Zeile')).toBe('Erste Zeile\nZweite Zeile');
		expect(normalizeTextSpacing('Absatz eins\n\nAbsatz zwei')).toBe('Absatz eins\n\nAbsatz zwei');
	});
});

describe('validating a single line', () => {
	it('accepts a clean or missing value', () => {
		expect(validateLineSpacing('Melanie Klein')).toBe(true);
		expect(validateLineSpacing()).toBe(true);
	});

	it('names spaces at the ends', () => {
		expect(validateLineSpacing('Melanie ')).toBe(
			'Bitte entferne die Leerzeichen am Anfang und am Ende.',
		);
	});

	it('names doubled spaces and line breaks', () => {
		expect(validateLineSpacing('Melanie  Klein')).toBe(
			'Bitte ersetze doppelte Leerzeichen und Zeilenumbrüche durch ein einzelnes Leerzeichen.',
		);
	});
});

describe('validating a multi-line text', () => {
	it('accepts line breaks', () => {
		expect(validateTextSpacing('Absatz eins\n\nAbsatz zwei')).toBe(true);
	});

	it('names spaces at the ends', () => {
		expect(validateTextSpacing('Ein Satz. ')).toBe(
			'Bitte entferne die Leerzeichen am Anfang und am Ende.',
		);
	});

	it('names doubled spaces', () => {
		expect(validateTextSpacing('Erster Satz.  Zweiter Satz.')).toBe(
			'Bitte ersetze doppelte Leerzeichen durch ein einzelnes.',
		);
	});
});
