import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../../test-utils/render';
import { Badge } from './badge';

// `variant` only ever changes `badgeVariants`' class string (see `./variants.ts`) — no role, text
// or other user-perceivable output changes between `default` and `ghost`, so it is deliberately not
// covered here; see the PR 4 report for the full reasoning. `asChild`, by contrast, changes what
// element the badge renders as, which is a real, user (and screen reader) perceivable difference.
describe('badge', () => {
	it('renders its children as text', () => {
		const { getByText } = renderWithUser(<Badge>Neu</Badge>);

		expect(getByText('Neu').textContent).toBe('Neu');
	});

	it('renders as the wrapped element instead of a span when asChild is set', () => {
		const { getByRole } = renderWithUser(
			<Badge asChild>
				<a href="https://tsg-irlich.de/kontakt">Kontakt</a>
			</Badge>,
		);

		const link = getByRole('link', { name: 'Kontakt' });
		expect(link.tagName).toBe('A');
		expect(link.getAttribute('href')).toBe('https://tsg-irlich.de/kontakt');
	});
});
