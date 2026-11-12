import { describe, expect, it } from 'vite-plus/test';

import { PARTNER_ICONS } from './partner-icons';

describe('partner icons', () => {
	it('names every icon once, in kebab-case', () => {
		const values = PARTNER_ICONS.map(({ value }) => value);

		expect(new Set(values).size).toBe(values.length);
		for (const value of values) {
			expect(value).toMatch(/^[a-z]+(?:-[a-z]+)*$/u);
		}
	});

	it('gives every icon a title', () => {
		for (const { title } of PARTNER_ICONS) {
			expect(title).toMatch(/\S/u);
		}
	});

	it('holds the icons of the prototype', () => {
		const values: string[] = PARTNER_ICONS.map(({ value }) => value);

		expect(values).toStrictEqual(
			expect.arrayContaining([
				'map-pin',
				'trending-up',
				'heart-handshake',
				'handshake',
				'shirt',
				'fence',
				'globe',
				'gift',
			]),
		);
	});
});
