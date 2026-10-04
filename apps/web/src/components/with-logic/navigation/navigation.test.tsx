import { within } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import type { MainNavigationQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../test-utils/render';
import { setPathname } from '../../../../test-utils/setup-dom';
import { Navigation } from './navigation';

type NavItem = NonNullable<MainNavigationQueryResult>['mainNavigation'][number];

const VEREIN: NavItem = {
	_key: 'verein',
	children: [
		{
			_key: 'kontakt',
			description: null,
			href: null,
			link: { _type: 'contact', category: null, slug: 'kontakt' },
			linkType: 'internal',
			title: 'Kontakt',
		},
	],
	hasTwoColumns: null,
	href: null,
	link: { _type: 'aboutUs', category: null, slug: 'verein' },
	linkType: 'internal',
	overviewDescription: null,
	overviewTitle: null,
	title: 'Verein',
};

const ANGEBOT: NavItem = {
	_key: 'angebot',
	children: [],
	hasTwoColumns: null,
	href: null,
	link: { _type: 'departmentsPage', category: null, slug: 'angebot' },
	linkType: 'internal',
	overviewDescription: null,
	overviewTitle: null,
	title: 'Angebot',
};

// `getInternalHref` returns `undefined` for a target without slug; the entry is dropped.
const UNRESOLVABLE: NavItem = {
	_key: 'unresolvable',
	children: [],
	hasTwoColumns: null,
	href: null,
	link: { _type: 'contact', category: null, slug: null },
	linkType: 'internal',
	overviewDescription: null,
	overviewTitle: null,
	title: 'Kaputt',
};

const NAV_ITEMS: NavItem[] = [VEREIN, ANGEBOT, UNRESOLVABLE];

function renderNavigation(navItems: NavItem[] = NAV_ITEMS) {
	return renderWithUser(<Navigation navItems={navItems} />);
}

/**
 * The mobile menu container, located through the `aria-controls` of the toggle button, so the
 * lookup fails as soon as that wiring breaks.
 *
 * @param container - The element to search within.
 * @returns The element the mobile menu toggle controls.
 * @throws {Error} If no element matches the toggle's `aria-controls`.
 */
function mobileMenu(container: HTMLElement): HTMLElement {
	const menuId = container.querySelector('button[aria-controls]')?.getAttribute('aria-controls');
	const menu = menuId ? container.querySelector(`#${menuId}`) : null;

	if (!(menu instanceof HTMLElement)) {
		throw new Error("no element matches the mobile menu toggle's aria-controls");
	}

	return menu;
}

describe('navigation', () => {
	it("names the navigation landmark, so it can be told apart from the page's other ones", () => {
		const { getByRole } = renderNavigation();

		expect(getByRole('navigation', { name: 'Hauptnavigation' })).not.toBeNull();
	});

	it('renders every resolvable entry in the desktop bar and in the mobile menu, and drops the rest', () => {
		const { container, getAllByRole, queryAllByRole } = renderNavigation();

		expect(getAllByRole('link', { name: 'Angebot' })).toHaveLength(2);
		expect(getAllByRole('button', { name: 'Verein' })).toHaveLength(2);
		expect(queryAllByRole('link', { name: 'Kaputt' })).toHaveLength(0);
		expect(within(mobileMenu(container)).getByRole('link', { name: 'Angebot' })).not.toBeNull();
	});

	it('marks the entry matching the current pathname with aria-current in both menus', () => {
		setPathname('/angebot/fussball');
		const { getAllByRole } = renderNavigation();

		for (const link of getAllByRole('link', { name: 'Angebot' })) {
			expect(link.getAttribute('aria-current')).toBe('page');
		}
	});

	it('offers the short contact link for the lg range, the long one from xl and in the mobile menu', () => {
		const { container, getAllByRole, getByRole } = renderNavigation();

		expect(getByRole('link', { name: 'Kontakt' }).getAttribute('href')).toBe('/kontakt');
		expect(getAllByRole('link', { name: 'Kontakt aufnehmen' })).toHaveLength(2);
		// The mobile copy used to be `sm:hidden`, which left 640–1023 px without any contact button.
		expect(
			within(mobileMenu(container))
				.getByRole('link', { name: 'Kontakt aufnehmen' })
				.getAttribute('href'),
		).toBe('/kontakt');
	});

	// The button's name stays the same in both states on purpose: `aria-expanded` already carries
	// open/closed, and a name that changes with the state gets announced on top of it.
	it('names the mobile menu toggle in German, and keeps that name when the menu opens', async () => {
		const { getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		expect(getByRole('button', { name: 'Menü' })).toBe(toggle);
	});

	it('wires the mobile menu toggle to the menu it controls and reports the collapsed state', () => {
		const { container, getByRole } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		const menuId = toggle.getAttribute('aria-controls');

		expect(menuId).not.toBeNull();
		expect(container.querySelector(`#${menuId}`)).not.toBeNull();
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
	});

	// jsdom does not implement `inert`'s behaviour, so the attribute is all this test can check; the
	// browser-level consequence is asserted in `e2e/specs/navigation.spec.ts`.
	it('marks the collapsed mobile menu inert so its links leave the accessibility tree and the tab order', () => {
		const { container } = renderNavigation();

		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});

	it('drops inert and flips aria-expanded when the toggle opens the mobile menu', async () => {
		const { container, getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(false);
	});

	it('restores inert and aria-expanded=false when the toggle closes the mobile menu again', async () => {
		const { container, getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);
		await user.click(toggle);

		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});

	it('closes the mobile menu on Escape and moves the focus back to the toggle', async () => {
		const { container, getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		// With the focus inside the menu, collapsing it would otherwise strand the focus: the
		// container becomes `inert`, so the browser drops the focus to `<body>`.
		const mobileLink = within(mobileMenu(container)).getByRole('link', { name: 'Angebot' });
		mobileLink.focus();
		expect(document.activeElement).toBe(mobileLink);

		await user.keyboard('{Escape}');

		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
		expect(document.activeElement).toBe(toggle);
	});

	it('leaves the focus where it is when Escape is pressed while the mobile menu is closed', async () => {
		const { getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		const logo = getByRole('link', { name: 'Logo der TSG Irlich 1882 e. V.' });
		logo.focus();

		await user.keyboard('{Escape}');

		expect(document.activeElement).toBe(logo);
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
	});

	it('collapses the mobile menu again when one of its links is followed, inside a group too', async () => {
		const { container, getByRole, user } = renderNavigation();

		const toggle = getByRole('button', { name: 'Menü' });
		const menu = within(mobileMenu(container));

		await user.click(toggle);
		await user.click(menu.getByRole('link', { name: 'Angebot' }));
		expect(toggle.getAttribute('aria-expanded')).toBe('false');

		await user.click(toggle);
		await user.click(menu.getByRole('button', { name: 'Verein' }));
		await user.click(menu.getByRole('link', { name: 'Übersicht' }));
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});
});
