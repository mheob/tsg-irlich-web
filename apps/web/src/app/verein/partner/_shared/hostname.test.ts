import { describe, expect, it } from 'vite-plus/test';

import { getHostname } from './hostname';

describe('the hostname of a sponsor website', () => {
	it('lowercases the host and drops a leading www', () => {
		expect(getHostname('https://www.Example.de/pfad')).toBe('example.de');
	});

	it('keeps a host without www', () => {
		expect(getHostname('https://swn-neuwied.de')).toBe('swn-neuwied.de');
	});

	it('returns nothing for a missing or unparseable url', () => {
		expect(getHostname('kein link')).toBeUndefined();
		expect(getHostname(null)).toBeUndefined();
	});
});
