import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TSGLogo } from './tsg-logo';

describe('rendering the tsg logo', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders an svg', () => {
		const { container } = render(<TSGLogo />);
		expect(container.querySelector('svg')).not.toBeNull();
	});

	// Every consumer (footer.tsx, navigation.tsx) wraps this in a Link that already carries its own
	// aria-label or title, so the logo itself has no accessible name of its own — asserted here via
	// the attributes that would give it one, since a bare <svg> has no implicit "img" role for
	// getByRole to match against.
	it('has no accessible name of its own, relying on a surrounding link for one', () => {
		const { container } = render(<TSGLogo />);
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('aria-label')).toBeNull();
		expect(svg?.getAttribute('aria-labelledby')).toBeNull();
		expect(svg?.querySelector('title')).toBeNull();
	});

	it('forwards an aria-label prop so a consumer can label it directly', () => {
		render(<TSGLogo aria-label="Logo der TSG Irlich" />);
		expect(screen.getByLabelText('Logo der TSG Irlich')).not.toBeNull();
	});
});
