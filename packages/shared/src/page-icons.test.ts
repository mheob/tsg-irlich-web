import { describe, expect, it } from 'vite-plus/test';

import { PAGE_ICONS } from './page-icons';

const values: string[] = PAGE_ICONS.map(({ value }) => value);

describe('page icons', () => {
	it('names every icon once, in the kebab-case of lucide.dev', () => {
		expect(new Set(values).size).toBe(values.length);
		for (const value of values) {
			// Lucide numbers some of its names, such as `building-2`.
			expect(value).toMatch(/^[a-z]+(?:-[a-z0-9]+)*$/u);
		}
	});

	it('gives every icon a title', () => {
		for (const { title } of PAGE_ICONS) {
			expect(title).toMatch(/\S/u);
		}
	});

	it('keeps every icon the partner page may have stored', () => {
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
				'trophy',
				'megaphone',
				'users',
				'heart',
				'star',
			]),
		);
	});

	it('holds the icons of the volunteer page prototype', () => {
		expect(values).toStrictEqual(
			expect.arrayContaining([
				'graduation-cap',
				'lightbulb',
				'award',
				'dumbbell',
				'flag',
				'building-2',
				'party-popper',
			]),
		);
	});
});
