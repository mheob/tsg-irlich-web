import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from './constants';

/**
 * One word: a run of characters that are neither whitespace nor an operator.
 *
 * The operators are the characters GROQ's `match` reads as syntax: `"` (phrase), `*` (wildcard),
 * `-` (negation), `(` and `)` (grouping), `|` (alternative), `~` (fuzziness) and `^` (boost). A
 * visitor's input must never act as one, so none of them reaches the text query. Everything else,
 * the dot in "1. Mannschaft" for one, is part of a word.
 */
const WORD_PATTERN = /[^\s"*\-()|~^]+/gu;

/** A high surrogate with no low surrogate behind it: half an emoji, left over by a cut. */
const DANGLING_HIGH_SURROGATE = /[\uD800-\uDBFF]$/u;

/**
 * Reads the search term of the `q` search parameter into the form the search works with: trimmed,
 * every run of whitespace (newlines included) collapsed to one space, cut to the maximum length.
 *
 * @param input - The raw `q` search parameter. A repeated parameter arrives as an array.
 * @returns The normalized term, an empty string when the parameter is missing or blank.
 */
function normalizeSearchInput(input: string[] | string | undefined): string {
	const value = Array.isArray(input) ? input[0] : input;
	const collapsed = (value ?? '').replaceAll(/\s+/gu, ' ').trim();

	// The cut counts UTF-16 units. One that falls inside an emoji must not leave half of it behind:
	// a lone surrogate makes `encodeURIComponent` throw when the term is put into a link.
	return collapsed.slice(0, SEARCH_MAX_LENGTH).replace(DANGLING_HIGH_SURROGATE, '').trimEnd();
}

/**
 * Splits a normalized search term into its words, lowercased and without operator characters. An
 * operator character inside a word separates it, so "E-Jugend" gives `e` and `jugend`, the same
 * words Sanity finds in a text that says "E-Jugend".
 *
 * @param normalized - The term, as `normalizeSearchInput` returns it.
 * @returns The words in the order they were typed, none of them empty.
 */
function getSearchWords(normalized: string): string[] {
	return normalized.toLowerCase().match(WORD_PATTERN) ?? [];
}

/**
 * Builds the term for GROQ's `text::query()`. The words are joined by spaces and the last one gets
 * a `*`, so a visitor who has typed "Tanz" so far already finds "Tanzen". The result goes into
 * the query as the parameter `$q` and nowhere else.
 *
 * @param normalized - The term, as `normalizeSearchInput` returns it.
 * @returns The text query, or `undefined` when the words together are shorter than the minimum
 * length. Input of nothing but operators, punctuation or whitespace ends up there too, so no
 * query reaches Sanity for it.
 */
function toTextQuery(normalized: string): string | undefined {
	const joined = getSearchWords(normalized).join(' ');

	return joined.length < SEARCH_MIN_LENGTH ? undefined : `${joined}*`;
}

export { getSearchWords, normalizeSearchInput, toTextQuery };
