import { describe, expect, it, vi } from 'vitest';

import { renderWithUser } from '../../../../test-utils/render';
import { NavigationAnchor } from './navigation-anchor';
import type { NavigationLink } from './navigation-entries';

const INTERNAL: NavigationLink = {
	href: '/verein',
	isActive: false,
	isExternal: false,
	key: 'verein',
	title: 'Verein',
};

const EXTERNAL: NavigationLink = {
	href: 'https://www.neuwied.de',
	isActive: false,
	isExternal: true,
	key: 'neuwied',
	title: 'Stadt Neuwied',
};

describe('navigation anchor', () => {
	it('renders an internal link in the same tab', () => {
		const { getByRole } = renderWithUser(<NavigationAnchor link={INTERNAL} />);

		const link = getByRole('link', { name: 'Verein' });

		expect(link.getAttribute('href')).toBe('/verein');
		expect(link.getAttribute('target')).toBeNull();
	});

	it('opens an external link in a new tab and says so to screen readers', () => {
		const { getByRole } = renderWithUser(<NavigationAnchor link={EXTERNAL} />);

		const link = getByRole('link', { name: 'Stadt Neuwied (öffnet in neuem Tab)' });

		expect(link.getAttribute('href')).toBe('https://www.neuwied.de');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('forwards the props Base UI merges into its render element', async () => {
		const onClick = vi.fn();
		const { getByRole, user } = renderWithUser(
			<NavigationAnchor aria-current="page" link={INTERNAL} onClick={onClick} />,
		);

		const link = getByRole('link', { name: 'Verein' });
		await user.click(link);

		expect(link.getAttribute('aria-current')).toBe('page');
		expect(onClick).toHaveBeenCalledOnce();
	});
});
