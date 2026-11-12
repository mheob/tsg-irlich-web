/** The phone layout of the logo wall: two tiles side by side. */
const PHONE_COLUMNS = 2;

/**
 * The column counts of the logo wall from `md`, `xl` and `2xl` up, most wanted first. A tablet has
 * no room for more than three tiles in a row, a wide screen for five.
 */
const COLUMN_CHOICES = {
	'2xl': [5, 4, 3],
	md: [3, 2],
	xl: [4, 3],
} as const;

type ColumnChoices = typeof COLUMN_CHOICES;

// The first count that leaves no tile alone in the last row and leaves no column of the first row
// empty, or the most wanted one when none does.
function pickColumns<T extends number>(tileCount: number, choices: readonly [T, ...T[]]): T {
	return choices.find((columns) => tileCount >= columns && tileCount % columns !== 1) ?? choices[0];
}

/**
 * Picks the column count of each breakpoint so that no tile stands alone in the last row, which is
 * where the own-logo tile sits (WEB-326). A count is only taken while the tiles fill at least one
 * row, so a short wall never ends in an empty column. Where no choice works, the first one stays.
 *
 * @param tileCount - The sponsors plus the own-logo tile.
 * @returns The column count per breakpoint, and whether the last tile spans both columns of the
 *   phone layout, where only two columns fit.
 */
function getPartnerColumns(tileCount: number): PartnerColumns {
	return {
		'2xl': pickColumns(tileCount, COLUMN_CHOICES['2xl']),
		isLastTileWide: tileCount > PHONE_COLUMNS && tileCount % PHONE_COLUMNS === 1,
		md: pickColumns(tileCount, COLUMN_CHOICES.md),
		xl: pickColumns(tileCount, COLUMN_CHOICES.xl),
	};
}

interface PartnerColumns {
	'2xl': ColumnChoices['2xl'][number];
	isLastTileWide: boolean;
	md: ColumnChoices['md'][number];
	xl: ColumnChoices['xl'][number];
}

export { getPartnerColumns };
export type { PartnerColumns };
