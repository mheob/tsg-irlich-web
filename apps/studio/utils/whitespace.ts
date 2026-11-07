/**
 * Whitespace rules for the text fields editors type into (WEB-425).
 *
 * Text pasted from a word processor or a phone often brings a space at the end or two in a row.
 * Nobody sees them in the studio, but the website does: a title with a trailing space became
 * "…1:4  | TSG Irlich" in the browser tab, and a name with two spaces "Melanie  Klein". The checks
 * below mark such a value, and the migration `trim-text-fields` cleans the existing documents with
 * the same normalization, so a cleaned value always passes its check.
 *
 * Only the ASCII space, tabs and line breaks count. A non-breaking space (U+00A0) is left alone:
 * an editor sets it on purpose, to keep "1. Mannschaft" on one line.
 */

/** A run of spaces, tabs or line breaks. */
const LINE_WHITESPACE = /[ \t\r\n]+/gu;

/** A run of spaces or tabs. */
const RUN_OF_SPACES = /[ \t]+/gu;

/** Spaces or tabs next to a line break. */
const SPACES_AROUND_LINE_BREAK = /[ \t]*\n[ \t]*/gu;

/** Whitespace at the start or the end. */
const OUTER_WHITESPACE = /^[ \t\r\n]+|[ \t\r\n]+$/gu;

const OUTER_MESSAGE = 'Bitte entferne die Leerzeichen am Anfang und am Ende.';
const LINE_INNER_MESSAGE =
	'Bitte ersetze doppelte Leerzeichen und Zeilenumbrüche durch ein einzelnes Leerzeichen.';
const TEXT_INNER_MESSAGE = 'Bitte ersetze doppelte Leerzeichen durch ein einzelnes.';

/**
 * Normalizes a single-line value: no whitespace at the ends, and every run of spaces, tabs or line
 * breaks inside becomes one space.
 *
 * @param value - The value of a `string` field.
 * @returns The normalized value.
 */
function normalizeLineSpacing(value: string): string {
	return value.replaceAll(OUTER_WHITESPACE, '').replaceAll(LINE_WHITESPACE, ' ');
}

/**
 * Normalizes a multi-line value: no whitespace at the ends, every run of spaces or tabs becomes one
 * space, and no space stays next to a line break. The line breaks themselves are kept, since
 * editors use them for paragraphs.
 *
 * @param value - The value of a `text` field.
 * @returns The normalized value.
 */
function normalizeTextSpacing(value: string): string {
	return value
		.replaceAll(/\r\n?/gu, '\n')
		.replaceAll(OUTER_WHITESPACE, '')
		.replaceAll(SPACES_AROUND_LINE_BREAK, '\n')
		.replaceAll(RUN_OF_SPACES, ' ');
}

/**
 * Tells whether a value starts or ends with whitespace.
 *
 * @param value - The value to check.
 * @returns `true` if there is whitespace at an end.
 */
function hasOuterWhitespace(value: string): boolean {
	return value.replaceAll(OUTER_WHITESPACE, '') !== value;
}

/**
 * Checks a single-line value for whitespace the website would show. A missing value passes, the
 * required rule names it.
 *
 * @param value - The value of a `string` field.
 * @returns `true`, or the message for an editor.
 */
function validateLineSpacing(value?: string): string | true {
	if (!value || normalizeLineSpacing(value) === value) {
		return true;
	}

	return hasOuterWhitespace(value) ? OUTER_MESSAGE : LINE_INNER_MESSAGE;
}

/**
 * Checks a multi-line value for whitespace the website would show. A missing value passes, the
 * required rule names it.
 *
 * @param value - The value of a `text` field.
 * @returns `true`, or the message for an editor.
 */
function validateTextSpacing(value?: string): string | true {
	if (!value || normalizeTextSpacing(value) === value) {
		return true;
	}

	return hasOuterWhitespace(value) ? OUTER_MESSAGE : TEXT_INNER_MESSAGE;
}

export { normalizeLineSpacing, normalizeTextSpacing, validateLineSpacing, validateTextSpacing };
