import { describe, expect, it } from 'vitest';

import spacer from './spacer';

interface SpacerSelection {
	readonly title?: string;
}

function prepareSpacer(selection: SpacerSelection): { title: string } {
	return (spacer.preview.prepare as unknown as (value: SpacerSelection) => { title: string })(
		selection,
	);
}

describe('spacer preview', () => {
	it('wraps the selected variant in the spacer label', () => {
		expect(prepareSpacer({ title: 'default' })).toStrictEqual({ title: 'Spacer (default)' });
	});

	// The `variant` field always carries the `default` initial value in the Studio, so this branch
	// is unlikely to be hit in practice — but the plain string interpolation stringifies a missing
	// value as the literal word "undefined" rather than omitting it, which is worth pinning down.
	it('stringifies a missing variant as the literal word "undefined"', () => {
		expect(prepareSpacer({})).toStrictEqual({ title: 'Spacer (undefined)' });
	});
});
