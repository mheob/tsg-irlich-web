import { describe, expect, it } from 'vite-plus/test';

import { withUniqueKeys } from './keys';

const byText = (text: string): string => text;

describe('unique keys for the entries of a list', () => {
	it('keeps the order and hands every entry back', () => {
		expect(withUniqueKeys(['Fahren', 'Feiern'], byText).map(({ value }) => value)).toStrictEqual([
			'Fahren',
			'Feiern',
		]);
	});

	it('counts the occurrences of an entry that comes twice', () => {
		expect(
			withUniqueKeys(['Fahren', 'Feiern', 'Fahren'], byText).map(({ key }) => key),
		).toStrictEqual(['1:Fahren', '1:Feiern', '2:Fahren']);
	});

	it('keeps an id that ends in a number apart from a repeated one', () => {
		const keys = withUniqueKeys(['A', 'A', '2:A', 'A-2'], byText).map(({ key }) => key);

		expect(new Set(keys).size).toBe(keys.length);
	});

	it('tells objects apart by the id it is given', () => {
		const quotes = [{ _id: 'q1' }, { _id: 'q1' }];

		expect(withUniqueKeys(quotes, (quote) => quote._id)).toStrictEqual([
			{ key: '1:q1', value: quotes[0] },
			{ key: '2:q1', value: quotes[1] },
		]);
	});
});
