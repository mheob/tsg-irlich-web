import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { Badge } from './badge';

// `variant` and `size` only ever change `badgeVariants`' class string (see `./variants.ts`) — no
// role, text or other user-perceivable output changes between `default` and `ghost` or `lg` and
// `sm`, so their styling is deliberately not covered here; see the PR 4 report for the full
// reasoning. `render`, by contrast, changes what element the badge renders as, which is a real,
// user (and screen reader) perceivable difference.
describe('badge', () => {
	it('renders its children as text', () => {
		const { getByText } = renderWithUser(<Badge>Neu</Badge>);

		expect(getByText('Neu').textContent).toBe('Neu');
	});

	// React drops a non-numeric `size` from a `<span>` by itself, so a leaked `size` only ever showed
	// up in the props a `render` target receives — which is where WEB-409 left it.
	it('keeps size to itself instead of handing it to the element it renders', () => {
		const renderSpan = vi.fn((props: ComponentProps<'span'>) => <span {...props} />);
		const { getByText } = renderWithUser(
			<Badge render={(props) => renderSpan(props)} size="sm">
				Neu
			</Badge>,
		);

		expect(getByText('Neu').textContent).toBe('Neu');
		expect(renderSpan.mock.lastCall?.[0]).not.toHaveProperty('size');
	});

	it('renders as the given element instead of a span when render is set', () => {
		const { getByRole } = renderWithUser(
			// The link text arrives as the badge's children, which the rule cannot follow into `render`
			// oxlint-disable-next-line jsx-a11y/control-has-associated-label
			<Badge render={<a href="https://tsg-irlich.de/kontakt" />}>Kontakt</Badge>,
		);

		const link = getByRole('link', { name: 'Kontakt' });
		expect(link.tagName).toBe('A');
		expect(link.getAttribute('href')).toBe('https://tsg-irlich.de/kontakt');
	});
});
