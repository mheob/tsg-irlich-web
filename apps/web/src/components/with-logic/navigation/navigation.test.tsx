import { waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { MockInstance } from 'vite-plus/test';

import type { MainNavigationQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../test-utils/render';
import { setPathname } from '../../../../test-utils/setup-dom';
import { Navigation } from './navigation';

type NavItem = NonNullable<MainNavigationQueryResult>['mainNavigation'][number];

const VEREIN: NavItem = {
	_key: 'verein',
	_type: 'mainNavigationMenu',
	children: [
		{
			_key: 'ueber-uns',
			description: null,
			href: null,
			link: { _type: 'aboutUs', category: null, department: null, slug: 'verein' },
			linkType: 'internal',
			title: 'Über uns',
		},
		{
			_key: 'kontakt',
			description: null,
			href: null,
			link: { _type: 'contact', category: null, department: null, slug: 'kontakt' },
			linkType: 'internal',
			title: 'Kontakt',
		},
	],
	hasTwoColumns: false,
	href: null,
	link: null,
	linkType: null,
	title: 'Verein',
};

const ANGEBOT: NavItem = {
	_key: 'angebot',
	_type: 'mainNavigationLink',
	children: [],
	hasTwoColumns: null,
	href: null,
	link: { _type: 'departmentsPage', category: null, department: null, slug: 'angebot' },
	linkType: 'internal',
	title: 'Angebot',
};

// `getInternalHref` returns `undefined` for a target without slug; the entry is dropped.
const UNRESOLVABLE: NavItem = {
	_key: 'unresolvable',
	_type: 'mainNavigationLink',
	children: [],
	hasTwoColumns: null,
	href: null,
	link: { _type: 'contact', category: null, department: null, slug: null },
	linkType: 'internal',
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
 * @throws {TypeError} If no element matches the toggle's `aria-controls`.
 */
function mobileMenu(container: HTMLElement): HTMLElement {
	const menuId = container.querySelector('button[aria-controls]')?.getAttribute('aria-controls');
	const menu = menuId ? container.querySelector(`#${menuId}`) : null;

	if (!(menu instanceof HTMLElement)) {
		throw new TypeError("no element matches the mobile menu toggle's aria-controls");
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
		await user.click(menu.getByRole('link', { name: 'Über uns' }));
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});

	describe('with the search', () => {
		let fetchSpy: MockInstance<typeof fetch>;

		beforeAll(async () => {
			// The panel is a lazy chunk. Loaded once up front, its first import cannot outlast
			// `findByRole` under a parallel coverage run; the lazy boundary then resolves at once.
			await import('../search/search-panel');
		});

		beforeEach(() => {
			// „Häufig gesucht“, which the panel asks for when it first opens.
			fetchSpy = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValueOnce(Response.json({ terms: ['Fußball'], title: 'Häufig gesucht' }));
		});

		afterEach(() => {
			fetchSpy.mockRestore();
		});

		it('shows a lupe „Suche öffnen“ in the desktop bar and one left of the menu toggle', () => {
			const { getAllByRole, getByRole } = renderNavigation();

			const lupes = getAllByRole('button', { name: 'Suche öffnen' });
			expect(lupes).toHaveLength(2);
			expect(getByRole('button', { name: 'Menü' }).previousElementSibling).toBe(lupes[1]);
		});

		it('loads nothing of the search before the lupe is pressed', () => {
			const { queryByRole } = renderNavigation();

			expect(queryByRole('dialog')).toBeNull();
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it('opens the dialog „Website durchsuchen“ with the focus in its input', async () => {
			const { findByRole, getAllByRole, user } = renderNavigation();

			await user.click(getAllByRole('button', { name: 'Suche öffnen' })[0]);

			const dialog = await findByRole('dialog', { name: 'Website durchsuchen' });
			await waitFor(() => {
				expect(document.activeElement).toBe(
					within(dialog).getByRole('combobox', { name: 'Suchbegriff' }),
				);
			});
		});

		it('hands the placeholder of the search page to the panel', async () => {
			const { findByRole, getAllByRole, user } = renderWithUser(
				<Navigation navItems={NAV_ITEMS} searchPlaceholder="Sportart, Gruppe oder Name" />,
			);

			await user.click(getAllByRole('button', { name: 'Suche öffnen' })[0]);

			const input = await findByRole('combobox', { name: 'Suchbegriff' });
			expect(input.getAttribute('placeholder')).toBe('Sportart, Gruppe oder Name');
		});

		it('returns the focus to the lupe that opened the search', async () => {
			const { findByRole, getAllByRole, queryByRole, user } = renderNavigation();
			const mobileLupe = getAllByRole('button', { name: 'Suche öffnen' })[1];

			await user.click(mobileLupe);
			await findByRole('dialog', { name: 'Website durchsuchen' });
			await user.keyboard('{Escape}');

			await waitFor(() => {
				expect(queryByRole('dialog')).toBeNull();
			});
			await waitFor(() => {
				expect(document.activeElement).toBe(mobileLupe);
			});
		});

		it('closes the search when the menu opens, and leaves the focus on the menu toggle', async () => {
			const { findByRole, getAllByRole, getByRole, queryByRole, user } = renderNavigation();
			// While the dialog is open everything outside it is hidden from assistive technology,
			// so the toggle is looked up before.
			const toggle = getByRole('button', { name: 'Menü' });

			await user.click(getAllByRole('button', { name: 'Suche öffnen' })[1]);
			await findByRole('dialog', { name: 'Website durchsuchen' });
			await user.click(toggle);

			await waitFor(() => {
				expect(queryByRole('dialog')).toBeNull();
			});
			expect(toggle.getAttribute('aria-expanded')).toBe('true');
			await waitFor(() => {
				expect(document.activeElement).toBe(toggle);
			});
		});

		it('closes the menu when the search opens', async () => {
			const { container, findByRole, getAllByRole, getByRole, user } = renderNavigation();
			const toggle = getByRole('button', { name: 'Menü' });

			await user.click(toggle);
			await user.click(getAllByRole('button', { name: 'Suche öffnen' })[1]);

			await expect(findByRole('dialog', { name: 'Website durchsuchen' })).resolves.not.toBeNull();
			expect(toggle.getAttribute('aria-expanded')).toBe('false');
			expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
		});

		it('closes the search when the page changes', async () => {
			const { findByRole, getAllByRole, queryByRole, rerender, user } = renderNavigation();

			await user.click(getAllByRole('button', { name: 'Suche öffnen' })[0]);
			await findByRole('dialog', { name: 'Website durchsuchen' });

			setPathname('/angebot');
			rerender(<Navigation navItems={NAV_ITEMS} />);

			await waitFor(() => {
				expect(queryByRole('dialog')).toBeNull();
			});
		});

		// The dialog hides the bar from assistive technology only. Without `inert` a pointer could
		// still open a menu over the panel or move the focus into the hidden bar.
		// jsdom does not implement `inert`'s behaviour, so the attribute is all this test can check.
		it('makes the bar inert while the search is open, all but the menu toggle', async () => {
			const { findByRole, getAllByRole, getByRole, queryByRole, user } = renderNavigation();
			const [desktopLupe, mobileLupe] = getAllByRole('button', { name: 'Suche öffnen' });
			const barControls = [
				getByRole('link', { name: 'Logo der TSG Irlich 1882 e. V.' }),
				// The desktop group comes first, the mobile menu's copy sits in its own container.
				getAllByRole('button', { name: 'Verein' })[0],
				getByRole('link', { name: 'Kontakt' }),
				desktopLupe,
				mobileLupe,
			];
			const toggle = getByRole('button', { name: 'Menü' });

			await user.click(desktopLupe);
			await findByRole('dialog', { name: 'Website durchsuchen' });

			expect(barControls.map((control) => control.closest('[inert]'))).not.toContain(null);
			expect(toggle.closest('[inert]')).toBeNull();

			// The toggle still opens the menu, which closes the search and frees the bar again.
			await user.click(toggle);

			await waitFor(() => {
				expect(queryByRole('dialog')).toBeNull();
			});
			expect(toggle.getAttribute('aria-expanded')).toBe('true');
			expect(barControls.map((control) => control.closest('[inert]'))).toStrictEqual(
				barControls.map(() => null),
			);
		});

		// Base UI only animates a dialog in that mounts closed and opens later. The panel mounts on
		// the first press of a lupe, so without care the first opening per page load would neither
		// slide nor fade in.
		it('lets the panel play its enter transition on the very first opening', async () => {
			let hasEnterTransition = false;
			const observer = new MutationObserver(() => {
				hasEnterTransition ||=
					document.querySelector('[role="dialog"][data-starting-style]') !== null;
			});
			observer.observe(document.body, { attributes: true, childList: true, subtree: true });
			const { findByRole, getAllByRole, user } = renderNavigation();

			await user.click(getAllByRole('button', { name: 'Suche öffnen' })[0]);
			const dialog = await findByRole('dialog', { name: 'Website durchsuchen' });
			observer.disconnect();

			expect(hasEnterTransition).toBe(true);
			await waitFor(() => {
				expect(document.activeElement).toBe(
					within(dialog).getByRole('combobox', { name: 'Suchbegriff' }),
				);
			});
		});
	});
});
