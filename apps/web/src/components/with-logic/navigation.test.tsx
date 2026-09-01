import { describe, expect, it } from 'vitest';

import type { MainNavigationQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../test-utils/render';
import { setPathname } from '../../../test-utils/setup-dom';
import { Navigation } from './navigation';

type NavItem = NonNullable<MainNavigationQueryResult>['mainNavigation'][number];

// The `mainNavigation` array items are `internalLink`/`externalLink` objects (see
// `apps/studio/schemas/objects/internal-link.ts` and `external-link.ts`) and neither schema type
// declares a `title` field, even though `mainNavigationQuery` (`src/lib/sanity/queries/main-
// navigation.ts`) projects `title` directly on every item. `MainNavigationQueryResult` therefore
// types every item's `title` as the literal `null` — there is no variant of `NavItem` with a
// non-null title, so a type-correct fixture cannot give a nav item visible text. This is a
// disagreement with the brief (which expects navigation items to render a visible label) and,
// read together, a real content bug in `main-navigation.ts`/the `site-settings` schema: on the
// current schema, every rendered `<Navigation>` item has an empty link text in production. It is
// out of scope for this test task (fixing it would touch the GROQ query or the schema), so the
// fixture below sets `title: null` to match the real type, and the tests identify links by `href`
// rather than by accessible name/text.

const ABOUT_US_ITEM: NavItem = {
	_key: 'nav-about-us',
	link: { _type: 'aboutUs', category: null, slug: 'ueber-uns' },
	title: null,
};

const NEWS_CATEGORY_ITEM: NavItem = {
	_key: 'nav-news',
	link: { _type: 'news.category', category: null, slug: 'meldungen' },
	title: null,
};

const GROUP_ITEM: NavItem = {
	_key: 'nav-group',
	// `group.soccer`'s department path is `/angebot/fussball` (`src/utils/groups.ts`), so
	// `getInternalHref` resolves this to `/angebot/fussball/herren-1`.
	link: { _type: 'group.soccer', category: null, slug: 'herren-1' },
	title: null,
};

// `getInternalHref` returns `undefined` when the target has no resolvable slug, and the component
// filters those items out entirely (`navigation.tsx`'s `.filter((item): item is ... => ...)`).
const UNRESOLVABLE_SLUG_ITEM: NavItem = {
	_key: 'nav-unresolvable',
	link: { _type: 'contact', category: null, slug: null },
	title: null,
};

// The discriminated union's other member: an item with no link at all is filtered out the same way.
const NO_LINK_ITEM: NavItem = { _key: 'nav-no-link', link: null, title: null };

const NAV_ITEMS: NavItem[] = [
	ABOUT_US_ITEM,
	NEWS_CATEGORY_ITEM,
	GROUP_ITEM,
	UNRESOLVABLE_SLUG_ITEM,
	NO_LINK_ITEM,
];

function renderNavigation(navItems: NavItem[]) {
	return renderWithUser(<Navigation navItems={navItems} />);
}

/**
 * Every anchor in `container` whose `href` attribute is exactly `href`.
 *
 * @param container - The element to search within.
 * @param href - The exact `href` attribute value to match.
 * @returns Every matching anchor element, in document order.
 */
function linksWithHref(container: HTMLElement, href: string): HTMLAnchorElement[] {
	return [...container.querySelectorAll<HTMLAnchorElement>(`a[href="${href}"]`)];
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
	it('renders the resolvable items as links with the href getInternalHref produces, once for the desktop list and once for the mobile list, and drops the unresolvable ones', () => {
		const { container, getAllByRole } = renderNavigation(NAV_ITEMS);

		expect(linksWithHref(container, '/ueber-uns')).toHaveLength(2);
		expect(linksWithHref(container, '/news/meldungen')).toHaveLength(2);
		expect(linksWithHref(container, '/angebot/fussball/herren-1')).toHaveLength(2);

		// Total links = logo (1) + 3 desktop nav items + desktop "Kontakt aufnehmen" (1) + 3 mobile
		// nav items + mobile "Kontakt aufnehmen" (1) = 9. Anything higher would mean one of the two
		// unresolvable items (`UNRESOLVABLE_SLUG_ITEM`, `NO_LINK_ITEM`) leaked through as a link.
		expect(getAllByRole('link')).toHaveLength(9);
	});

	it('marks the item matching the current pathname with aria-current in both the desktop and the mobile list', () => {
		setPathname('/ueber-uns');
		const { container } = renderNavigation(NAV_ITEMS);

		const activeLinks = linksWithHref(container, '/ueber-uns');

		expect(activeLinks).toHaveLength(2);
		for (const link of activeLinks) {
			expect(link.getAttribute('aria-current')).toBe('page');
		}
	});

	it('leaves aria-current off every item that does not match the current pathname', () => {
		setPathname('/ueber-uns');
		const { container } = renderNavigation(NAV_ITEMS);

		const inactiveLinks = [
			...linksWithHref(container, '/news/meldungen'),
			...linksWithHref(container, '/angebot/fussball/herren-1'),
		];

		expect(inactiveLinks).toHaveLength(4);
		for (const link of inactiveLinks) {
			expect(link.getAttribute('aria-current')).toBeNull();
		}
	});

	// The button's name stays the same in both states on purpose: `aria-expanded` already carries
	// open/closed, and a name that changes with the state gets announced on top of it.
	it('names the mobile menu toggle in German, and keeps that name when the menu opens', async () => {
		const { getByRole, user } = renderNavigation(NAV_ITEMS);

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		expect(getByRole('button', { name: 'Menü' })).toBe(toggle);
	});

	it('names the navigation landmark, so it can be told apart from the page\'s other ones', () => {
		const { getByRole } = renderNavigation(NAV_ITEMS);

		expect(getByRole('navigation', { name: 'Hauptnavigation' })).not.toBeNull();
	});

	it('wires the mobile menu toggle to the menu it controls and reports the collapsed state', () => {
		const { container, getByRole } = renderNavigation(NAV_ITEMS);

		const toggle = getByRole('button', { name: 'Menü' });
		const menuId = toggle.getAttribute('aria-controls');

		expect(menuId).not.toBeNull();
		expect(container.querySelector(`#${menuId}`)).not.toBeNull();
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
	});

	// The collapsed menu keeps its links in the DOM so the open/close transition has something to
	// animate, so `inert` is what takes them out of the accessibility tree and out of the tab order.
	// jsdom does not implement `inert`'s behaviour, so the attribute is all this test can check; the
	// browser-level consequence is asserted in `e2e/specs/navigation.spec.ts`.
	it('marks the collapsed mobile menu inert so its links leave the accessibility tree and the tab order', () => {
		const { container } = renderNavigation(NAV_ITEMS);

		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});

	it('drops inert and flips aria-expanded when the toggle opens the mobile menu', async () => {
		const { container, getByRole, user } = renderNavigation(NAV_ITEMS);

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(false);
	});

	it('restores inert and aria-expanded=false when the toggle closes the mobile menu again', async () => {
		const { container, getByRole, user } = renderNavigation(NAV_ITEMS);

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);
		await user.click(toggle);

		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});

	it('closes the mobile menu on Escape and moves the focus back to the toggle', async () => {
		const { container, getByRole, user } = renderNavigation(NAV_ITEMS);

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		// With the focus inside the menu, collapsing it would otherwise strand the focus: the
		// container becomes `inert`, so the browser drops the focus to `<body>`.
		const [, mobileLink] = linksWithHref(container, '/ueber-uns');
		mobileLink.focus();
		expect(document.activeElement).toBe(mobileLink);

		await user.keyboard('{Escape}');

		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
		expect(document.activeElement).toBe(toggle);
	});

	it('leaves the focus where it is when Escape is pressed while the mobile menu is closed', async () => {
		const { getByRole, user } = renderNavigation(NAV_ITEMS);

		const toggle = getByRole('button', { name: 'Menü' });
		const logo = getByRole('link', { name: 'Logo der TSG Irlich 1882 e. V.' });
		logo.focus();

		await user.keyboard('{Escape}');

		expect(document.activeElement).toBe(logo);
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
	});

	it('collapses the mobile menu again when one of its links is followed', async () => {
		const { container, getByRole, user } = renderNavigation(NAV_ITEMS);

		const toggle = getByRole('button', { name: 'Menü' });
		await user.click(toggle);

		// `linksWithHref` returns document order, so the second hit is the mobile list's copy.
		const [, mobileLink] = linksWithHref(container, '/ueber-uns');
		await user.click(mobileLink);

		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(mobileMenu(container).hasAttribute('inert')).toBe(true);
	});
});
