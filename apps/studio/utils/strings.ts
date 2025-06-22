import slugifyFn from 'slugify';

const unneededWords = new Set([
	'aber',
	'an',
	'auf',
	'das',
	'der',
	'die',
	'ein',
	'eine',
	'einem',
	'einen',
	'einer',
	'eines',
	'im',
	'in',
	'oder',
	'sowie',
	'und',
	'von',
	'weil',
	'zu',
]);

/**
 * Converts a given string into a URL-friendly slug.
 *
 * - Uses the German locale for slugification.
 * - Converts the string to lowercase.
 * - Removes all non-alphanumeric characters except spaces.
 * - Trims whitespace.
 * - Removes common unneeded German words (e.g., "und", "der", "die", etc.).
 *
 * @param input - The input string to be slugified.
 * @returns The slugified string, with unneeded words removed and words joined by hyphens.
 *
 * @example
 * slugify("Das beste Angebote nur für dich!") // "beste-angebot-nur-fuer-dich"
 */
export function slugify(input: string): string {
	return slugifyFn(input, {
		locale: 'de',
		lower: true,
		remove: /[^a-z0-9\s]/gi,
		trim: true,
	})
		.split('-')
		.filter(word => !unneededWords.has(word))
		.join('-');
}
