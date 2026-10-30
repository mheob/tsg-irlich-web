import { describe, expect, it } from 'vite-plus/test';

import { getSearchPath } from './path';

describe('the path of the search page', () => {
	it('carries the search term as q', () => {
		expect(getSearchPath('Tanzen')).toBe('/suche?q=Tanzen');
	});

	it('encodes what a URL cannot hold as it is', () => {
		expect(getSearchPath('Fußball & Jugend')).toBe('/suche?q=Fu%C3%9Fball%20%26%20Jugend');
	});

	it('leaves „Alle“ without a typ', () => {
		expect(getSearchPath('Tanzen', 'alle')).toBe('/suche?q=Tanzen');
	});

	it.each(['seiten', 'news'] as const)('names the tab %s as typ', (tab) => {
		expect(getSearchPath('Tanzen', tab)).toBe(`/suche?q=Tanzen&typ=${tab}`);
	});
});
