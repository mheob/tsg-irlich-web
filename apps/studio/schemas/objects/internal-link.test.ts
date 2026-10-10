import { describe, expect, it } from 'vite-plus/test';

import { INTERNAL_LINK_TARGETS } from './internal-link';

describe('internal link targets', () => {
	// Editors link the archive from the "Verein" menu; the issues themselves are reached from there.
	it('offers the TSG-Echo archive', () => {
		expect(INTERNAL_LINK_TARGETS).toContainEqual({ type: 'echoOverview' });
	});
});
