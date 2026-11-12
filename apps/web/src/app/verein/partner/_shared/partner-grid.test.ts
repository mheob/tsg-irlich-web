import { describe, expect, it } from 'vite-plus/test';

import { getPartnerColumns } from './partner-grid';

describe('the columns of the partner logo wall', () => {
	// Four sponsors plus the own-logo tile, as on the live page: a 4-column row would leave the
	// own-logo tile alone in the second row.
	it('lays out five tiles in rows of three and in one row of five on wide screens', () => {
		expect(getPartnerColumns(5)).toStrictEqual({
			'2xl': 5,
			isLastTileWide: true,
			md: 3,
			xl: 3,
		});
	});

	it('keeps four columns where they leave no tile alone', () => {
		expect(getPartnerColumns(6)).toStrictEqual({
			'2xl': 4,
			isLastTileWide: false,
			md: 3,
			xl: 4,
		});
	});

	it('never opens more columns than there are tiles', () => {
		expect(getPartnerColumns(4)).toStrictEqual({
			'2xl': 4,
			isLastTileWide: false,
			md: 2,
			xl: 4,
		});
		expect(getPartnerColumns(3)).toStrictEqual({
			'2xl': 3,
			isLastTileWide: true,
			md: 3,
			xl: 3,
		});
	});

	it('lets the last tile fill the row of the two-column phone layout only when it would be alone', () => {
		expect(getPartnerColumns(9).isLastTileWide).toBe(true);
		expect(getPartnerColumns(8).isLastTileWide).toBe(false);
		expect(getPartnerColumns(1).isLastTileWide).toBe(false);
	});

	// Seven tiles leave one alone in rows of three and of two alike, and a tablet has no room for
	// more columns, so the first choice stays.
	it('falls back to the preferred count when no choice avoids a lone tile', () => {
		expect(getPartnerColumns(7).md).toBe(3);
	});

	it('handles a wall of a single tile', () => {
		expect(getPartnerColumns(1)).toStrictEqual({
			'2xl': 5,
			isLastTileWide: false,
			md: 3,
			xl: 4,
		});
	});
});
