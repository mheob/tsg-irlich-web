import { SNIPPET_LENGTH } from './constants';

/** Marks each side of a snippet where the text goes on. */
const ELLIPSIS = '…';

/**
 * What may not stand right before a match: a letter, a combining mark (an umlaut can come as a
 * letter plus a mark) or a digit. Regex `\b` is no choice here. It only knows ASCII letters, even
 * with the `u` flag, so it calls "ä", "ö", "ü" and "ß" non-word characters: `tanz` would mark
 * "ätanz", and a word starting with an umlaut would not count as a start.
 */
const NOT_AFTER_WORD_CHARACTER = String.raw`(?<![\p{L}\p{M}\p{N}])`;

/** Characters that have a meaning in a regular expression and have to be escaped to be literal. */
const REGEXP_SPECIAL_CHARACTERS = /[$()*+.?[\\\]^{|}]/gu;

/**
 * Turns the search words into one regular expression that finds a word's start: the word itself,
 * with any case, at the beginning of a word. A match covers just the typed prefix, so `tanz` marks
 * "Tanz" in "Tanzen" and nothing in "Distanz".
 *
 * @param words - The search words.
 * @returns The expression, or `undefined` when no word is left to look for. It has one capture
 * group around the whole match, which `splitHighlights` relies on.
 */
function createMatcher(words: string[]): RegExp | undefined {
	const alternatives = [...new Set(words.filter((word) => word.length > 0))]
		// The longest word first, so `tanz` and `tanzen` together mark "Tanzen" whole.
		.toSorted((first, second) => second.length - first.length)
		.map((word) => word.replaceAll(REGEXP_SPECIAL_CHARACTERS, String.raw`\$&`));

	if (alternatives.length === 0) {
		return undefined;
	}

	return new RegExp(`${NOT_AFTER_WORD_CHARACTER}(${alternatives.join('|')})`, 'iu');
}

/**
 * Cuts the start of a window forward to the start of a word, but never past the match.
 *
 * @param text - The text.
 * @param from - The start the window has before it is cut.
 * @param limit - The index of the match, which has to stay inside the window.
 * @returns The start of the next word after `from`, or `from` itself when it already is one or
 * the next word starts behind the match.
 */
function snapToWordStart(text: string, from: number, limit: number): number {
	if (from === 0 || text[from - 1] === ' ') {
		return from;
	}

	const nextStart = text.indexOf(' ', from) + 1;

	return nextStart > 0 && nextStart <= limit ? nextStart : from;
}

/**
 * Cuts the end of a window back to the end of a word, but never into the match.
 *
 * @param text - The text.
 * @param from - The end the window has before it is cut, exclusive.
 * @param limit - The index right behind the match, which has to stay inside the window.
 * @returns The index of the space that ends the last word before `from`, or `from` itself when
 * the text ends there, a word does, or the match would be cut.
 */
function snapToWordEnd(text: string, from: number, limit: number): number {
	if (from >= text.length || text[from] === ' ') {
		return from;
	}

	const lastSpace = text.lastIndexOf(' ', from - 1);

	return lastSpace >= limit ? lastSpace : from;
}

/**
 * Places the window of a snippet: at most `length` characters, centred on the first match, cut at
 * word boundaries. Without a match it is the start of the text.
 *
 * @param plain - The text, with its whitespace collapsed.
 * @param words - The search words.
 * @param length - The most characters the window holds.
 * @returns The start and the end of the window, the end exclusive.
 */
function getSnippetWindow(plain: string, words: string[], length: number): SnippetWindow {
	// Without a match this is index 0 with a length of 0, which puts the window at the start.
	const match = createMatcher(words)?.exec(plain);
	const matchStart = match?.index ?? 0;
	const matchEnd = matchStart + (match?.[0].length ?? 0);

	const middle = Math.floor((matchStart + matchEnd) / 2);
	const start = Math.max(0, Math.min(middle - Math.floor(length / 2), plain.length - length));

	return {
		end: snapToWordEnd(plain, start + length, matchEnd),
		start: snapToWordStart(plain, start, matchStart),
	};
}

/**
 * Cuts a text snippet from the plain text of a document, around the first place a search word
 * starts a word. It is what the hit shows under its title.
 *
 * - A text that fits is returned whole.
 * - A longer one is cut to a window of at most `length` characters, at word boundaries, centred on
 *   the first match. Without a match the window is the start of the text.
 * - An ellipsis stands on every side where text was cut away.
 *
 * @param text - The plain text. Its whitespace, newlines included, is collapsed first.
 * @param words - The search words, as `getSearchWords` returns them.
 * @param length - The most characters the snippet shows, not counting its ellipses.
 * @returns The snippet, or `undefined` when the text is empty.
 */
function getSnippet(
	text: string,
	words: string[],
	length: number = SNIPPET_LENGTH,
): string | undefined {
	const plain = text.replaceAll(/\s+/gu, ' ').trim();
	if (plain.length <= length) {
		return plain.length > 0 ? plain : undefined;
	}

	const { end, start } = getSnippetWindow(plain, words, length);
	const before = start > 0 ? ELLIPSIS : '';
	const after = end < plain.length ? ELLIPSIS : '';

	return `${before}${plain.slice(start, end).trim()}${after}`;
}

/**
 * Splits a text into the parts around the places a search word starts a word, so a component can
 * wrap the matches in `<mark>`. A match is the typed prefix, in any case: `tanz` marks "Tanz" in
 * "Tanzen", but not in "Distanz".
 *
 * @param text - The text, a title or a snippet.
 * @param words - The search words, as `getSearchWords` returns them.
 * @returns The parts in order, which joined give the text again. None is empty, and neither is the
 * list unless the text is.
 */
function splitHighlights(text: string, words: string[]): HighlightPart[] {
	const matcher = createMatcher(words);
	if (!matcher) {
		return text.length > 0 ? [{ isMatch: false, text }] : [];
	}

	// With one capture group, `split` puts every match at an odd index between the pieces around it.
	return text
		.split(matcher)
		.map((part, index) => ({ isMatch: index % 2 === 1, text: part }))
		.filter((part) => part.text.length > 0);
}

interface HighlightPart {
	isMatch: boolean;
	text: string;
}

interface SnippetWindow {
	end: number;
	start: number;
}

export { getSnippet, splitHighlights };
export type { HighlightPart };
