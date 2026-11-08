import { describe, expect, it } from 'vite-plus/test';

import { getAgeOn } from './age';

describe('age on a reference date', () => {
	it('counts a birthday on the reference date', () => {
		expect(getAgeOn('2011-05-14', '2027-05-14')).toBe(16);
	});

	it('stays younger the day before', () => {
		expect(getAgeOn('2011-05-15', '2027-05-14')).toBe(15);
	});

	it('counts a later month as passed', () => {
		expect(getAgeOn('2011-04-30', '2027-05-14')).toBe(16);
	});

	it('treats 29 February as reached on 1 March in non-leap years', () => {
		expect(getAgeOn('2012-02-29', '2027-02-28')).toBe(14);
		expect(getAgeOn('2012-02-29', '2027-03-01')).toBe(15);
	});

	it('rejects a malformed date', () => {
		expect(() => getAgeOn('14.05.2011', '2027-05-14')).toThrow(TypeError);
	});
});
