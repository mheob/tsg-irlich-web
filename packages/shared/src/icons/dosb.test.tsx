import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DOSBIcon } from './dosb';

describe('rendering the dosb icon', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders an svg for a known icon name', () => {
		const { container } = render(<DOSBIcon icon="Turnen" />);
		expect(container.querySelector('svg')).not.toBeNull();
	});

	// Every consumer (both group-card components) renders this inside a link or article that
	// already carries the group's title or its own aria-label, so the icon itself has no accessible
	// name of its own — the same reasoning as tsg-logo.test.tsx.
	it('has no accessible name of its own, relying on a surrounding link for one', () => {
		const { container } = render(<DOSBIcon icon="Turnen" />);
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('aria-label')).toBeNull();
		expect(svg?.getAttribute('aria-labelledby')).toBeNull();
		expect(svg?.querySelector('title')).toBeNull();
	});

	// The 17 icons are distinguished only by SVG path data, which is unmaintainable to pin and
	// breaks on any icon-set update. This asserts the narrower, stable fact instead: two different
	// icon names actually render different markup, without pinning either one's geometry.
	it('renders different markup for different icon names', () => {
		const { container: turnen } = render(<DOSBIcon icon="Turnen" />);
		const { container: yoga } = render(<DOSBIcon icon="Yoga" />);
		expect(turnen.innerHTML).not.toBe(yoga.innerHTML);
	});

	it('falls back to rendering the icon prop as plain text for an unknown icon name', () => {
		render(<DOSBIcon icon="Z" />);
		expect(screen.getByText('Z')).not.toBeNull();
	});
});
