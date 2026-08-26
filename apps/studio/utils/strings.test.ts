import { describe, expect, it } from 'vitest';

import { slugify } from './strings';

describe('slug creation', () => {
	// The JSDoc example claims `slugify("Das beste Angebote nur für dich!")` returns
	// "beste-angebot-nur-fuer-dich" (singular "Angebot"). The implementation never singularizes
	// anything, so the real output keeps the plural "Angebote" — verified directly against the
	// `slugify` package plus the `unneededWords` filter before writing this assertion.
	it('slugifies the example from its own JSDoc', () => {
		expect(slugify('Das beste Angebote nur für dich!')).toBe('beste-angebote-nur-fuer-dich');
	});

	it('transliterates umlauts with the German locale', () => {
		expect(slugify('für')).toBe('fuer');
	});

	it('removes punctuation', () => {
		expect(slugify('Hallo, Welt!!!')).toBe('hallo-welt');
	});

	it('drops filler words from the unneededWords set', () => {
		expect(slugify('Der Termin und die Anmeldung')).toBe('termin-anmeldung');
	});

	it('returns an empty string when every word is a filler word', () => {
		expect(slugify('und der die das')).toBe('');
	});

	it('leaves an already-slugged input unchanged', () => {
		expect(slugify('schon-fertig')).toBe('schon-fertig');
	});

	it('lowercases a single non-filler word and keeps it', () => {
		expect(slugify('Hallo')).toBe('hallo');
	});
});
