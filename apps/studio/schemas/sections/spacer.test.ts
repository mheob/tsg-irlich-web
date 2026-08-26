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

	// Regression case: the field was renamed `size` → `variant` in commit 5523378 (Dec 2024), and
	// `initialValue: 'default'` was only added at that point — Sanity does not backfill data on a
	// rename or apply `initialValue` retroactively, and there is no migration script anywhere in
	// this repo. Any spacer object created before that rename has its data stranded under the old
	// `size` key, so `select: { title: 'variant' }` resolves to `undefined` for it and the plain
	// string interpolation below stringifies that as the literal word "undefined" instead of
	// omitting it — a real, minor, Studio-only defect (list previews only, not the rendered site)
	// that this test pins rather than fixes.
	it('stringifies a missing variant as the literal word "undefined"', () => {
		expect(prepareSpacer({})).toStrictEqual({ title: 'Spacer (undefined)' });
	});
});
