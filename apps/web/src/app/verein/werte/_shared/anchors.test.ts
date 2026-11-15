import { describe, expect, it } from 'vite-plus/test';

import { withValueAnchors } from './anchors';

function anchorsOf(titles: string[]): string[] {
	return withValueAnchors(titles.map((title) => ({ title }))).map(({ anchor }) => anchor);
}

describe(withValueAnchors, () => {
	it('builds a readable anchor from every title, umlauts spelled out', () => {
		expect(
			anchorsOf(['Sportverein für alle', 'Gesellschaftliche Verantwortung', 'Größe & Maß']),
		).toStrictEqual([
			'wert-sportverein-fuer-alle',
			'wert-gesellschaftliche-verantwortung',
			'wert-groesse-mass',
		]);
	});

	it('numbers a repeated title, so every id stays unique', () => {
		expect(anchorsOf(['Vielfalt', 'Vielfalt'])).toStrictEqual(['wert-vielfalt', 'wert-2']);
	});

	it('falls back to the number for a title without a letter or digit', () => {
		expect(anchorsOf(['–'])).toStrictEqual(['wert-1']);
	});

	it('keeps every value next to its anchor', () => {
		const value = { title: 'Vielfalt', icon: 'heart' };

		expect(withValueAnchors([value])).toStrictEqual([{ anchor: 'wert-vielfalt', value }]);
	});
});
