import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { Separator } from './separator';

// `decorative` is the only prop that changes what a screen reader sees: Base UI's `Separator`
// always renders `role="separator"`, so the wrapper overrides the role and `aria-orientation` to
// keep the distinction Radix's prop made.
describe('separator', () => {
	it('hides itself from assistive technology by default', () => {
		const { container } = renderWithUser(<Separator />);
		const separator = container.querySelector('[data-slot="separator"]');

		expect(separator?.getAttribute('role')).toBe('none');
		expect(separator?.getAttribute('aria-orientation')).toBeNull();
	});

	it('announces itself with its orientation when it is not decorative', () => {
		const { getByRole } = renderWithUser(<Separator orientation="vertical" decorative={false} />);

		const separator = getByRole('separator');
		expect(separator.getAttribute('aria-orientation')).toBe('vertical');
		expect(separator.dataset.orientation).toBe('vertical');
	});
});
