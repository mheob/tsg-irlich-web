const DIGITS = 2;

/**
 * The number a value carries on the page, two digits like the areas of the volunteer page.
 *
 * @param index - The position of the value, from 0.
 * @returns `01`, `02`, …
 */
function toNumber(index: number): string {
	return String(index + 1).padStart(DIGITS, '0');
}

export { toNumber };
