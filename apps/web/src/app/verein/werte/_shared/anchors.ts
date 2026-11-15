const UMLAUTS: readonly (readonly [string, string])[] = [
	['ä', 'ae'],
	['ö', 'oe'],
	['ü', 'ue'],
	['ß', 'ss'],
];

/**
 * Turns the title of a value into the readable part of its anchor: „Gesellschaftliche
 * Verantwortung“ becomes `gesellschaftliche-verantwortung`.
 *
 * @param title - The title of the value.
 * @returns The lower-case words joined by hyphens, empty for a title without a letter or digit.
 */
function toSlug(title: string): string {
	let slug = title.toLowerCase();

	for (const [umlaut, replacement] of UMLAUTS) {
		slug = slug.replaceAll(umlaut, replacement);
	}

	return slug.replaceAll(/[^a-z0-9]+/gu, '-').replaceAll(/^-|-$/gu, '');
}

/**
 * Gives every value an anchor the table of contents links to, such as `#wert-vielfalt`. The
 * editors may name two values alike, and an id must be unique on the page, so a repeated anchor
 * gets the number of its value; a title without a letter or digit falls back to that number alone.
 *
 * @param values - The values, in their order.
 * @returns Every value with its anchor, in the same order.
 */
function withValueAnchors<T extends { title: string }>(
	values: readonly T[],
): { anchor: string; value: T }[] {
	const used = new Set<string>();

	return values.map((value, index) => {
		const slug = toSlug(value.title);
		const anchor = slug && !used.has(`wert-${slug}`) ? `wert-${slug}` : `wert-${index + 1}`;

		used.add(anchor);

		return { anchor, value };
	});
}

export { withValueAnchors };
