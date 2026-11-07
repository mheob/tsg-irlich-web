import { defineMigration, set } from 'sanity/migrate';
import type { Path } from 'sanity/migrate';

import { normalizeLineSpacing, normalizeTextSpacing } from '../../utils/whitespace';

/** The index of the last segment of a path, which names the field. */
const LAST_SEGMENT = -1;

/** Single-line fields, wherever they sit in a document: on top or inside a section or a stat. */
const LINE_FIELDS = new Set(['firstName', 'lastName', 'subtitle', 'title']);

/** Multi-line fields, whose line breaks stay. */
const TEXT_FIELDS = new Set(['excerpt']);

/**
 * Works out the cleaned value of a string, if it needs one (WEB-425).
 *
 * The field is the last segment of the path, so a `title` is cleaned on the document as well as
 * inside the body sections (`body[].title`) and the stats (`stats[].title`), which carried the same
 * trailing spaces. Any other string, a slug or a rich text span included, stays as it is.
 *
 * @param value - The string the migration visits.
 * @param path - Its path in the document.
 * @returns The cleaned value, or `undefined` when there is nothing to change.
 */
function getCleanedValue(value: string, path: Path): string | undefined {
	const field = path.at(LAST_SEGMENT);
	if (typeof field !== 'string') {
		return undefined;
	}

	let cleaned = value;
	if (LINE_FIELDS.has(field)) {
		cleaned = normalizeLineSpacing(value);
	} else if (TEXT_FIELDS.has(field)) {
		cleaned = normalizeTextSpacing(value);
	}

	return cleaned === value ? undefined : cleaned;
}

export default defineMigration({
	// Every content type, but no asset or system document: an image asset has a `title` of its own.
	filter: '!(_type match "sanity.*") && !(_type match "system.*")',
	migrate: {
		string(node, path) {
			const cleaned = getCleanedValue(node, path);

			// A clean value stays as it is, which also makes a second run a no-op.
			return cleaned === undefined ? undefined : set(cleaned);
		},
	},
	title: 'Leerzeichen am Anfang, am Ende und doppelte Leerzeichen aus Titeln und Namen entfernen',
});

export { getCleanedValue };
