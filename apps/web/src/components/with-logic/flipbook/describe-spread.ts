/**
 * Describes what is on screen, e.g. `Seite 1 von 52` for the cover or `Seiten 2–3 von 52` for a spread.
 *
 * @param visiblePages - The 0-based leaf indices on screen, in reading order.
 * @param pageCount - How many leaves the book has.
 * @returns The text of the indicator, empty before the book has loaded.
 */
function describeSpread(visiblePages: readonly number[], pageCount: number): string {
	if (visiblePages.length === 0 || pageCount === 0) {
		return '';
	}
	const first = Math.min(...visiblePages);
	const last = Math.max(...visiblePages);
	return first === last
		? `Seite ${first + 1} von ${pageCount}`
		: `Seiten ${first + 1}–${last + 1} von ${pageCount}`;
}

export { describeSpread };
