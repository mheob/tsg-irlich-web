import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { NavigationAnchor } from './navigation-anchor';
import type { NavigationLink } from './navigation-entries';

const INTERNAL: NavigationLink = {
	description: null,
	href: '/verein',
	isActive: false,
	isExternal: false,
	key: 'verein',
	title: 'Verein',
};

const EXTERNAL: NavigationLink = {
	description: null,
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

	// The dropdown shows a sub-text under the title. It is announced as the link's description, so the
	// name stays the title a visitor looks for.
	it('names a link after its title and describes it with its sub-text when asked to', () => {
		const { getByRole } = renderWithUser(
			<NavigationAnchor
				link={{ ...INTERNAL, description: 'Alles über die TSG' }}
				withDescription
			/>,
		);

		const link = getByRole('link', { description: 'Alles über die TSG', name: 'Verein' });

		expect(link.getAttribute('href')).toBe('/verein');
	});

	it('keeps the new-tab hint in the name of an external link with a sub-text', () => {
		const { getByRole } = renderWithUser(
			<NavigationAnchor
				link={{ ...EXTERNAL, description: 'Die Stadt, zu der Irlich gehört' }}
				withDescription
			/>,
		);

		expect(
			getByRole('link', {
				description: 'Die Stadt, zu der Irlich gehört',
				name: 'Stadt Neuwied (öffnet in neuem Tab)',
			}).getAttribute('target'),
		).toBe('_blank');
	});

	it('leaves the sub-text out unless it is asked for', () => {
		const { getByRole, queryByText } = renderWithUser(
			<NavigationAnchor link={{ ...INTERNAL, description: 'Alles über die TSG' }} />,
		);

		expect(getByRole('link', { name: 'Verein' }).getAttribute('aria-describedby')).toBeNull();
		expect(queryByText('Alles über die TSG')).toBeNull();
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
