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

	it('exposes no attribute that would let assistive technology identify the item matching the current pathname — the active state is only expressed through a CSS class', () => {
		setPathname('/ueber-uns');
		const { container } = renderNavigation(NAV_ITEMS);

		const activeLinks = linksWithHref(container, '/ueber-uns');
		const inactiveLinks = linksWithHref(container, '/news/meldungen');

		for (const link of [...activeLinks, ...inactiveLinks]) {
			expect(link.getAttribute('aria-current')).toBeNull();
		}
	});

	it('does not expose an aria-expanded (or any other) state on the mobile menu toggle button', () => {
		const { getByRole } = renderNavigation(NAV_ITEMS);

		const toggle = getByRole('button', { name: 'Toggle menu' });

		expect(toggle.getAttribute('aria-expanded')).toBeNull();
		expect(toggle.getAttribute('aria-controls')).toBeNull();
	});

	it('leaves every nav link present in the DOM regardless of whether the mobile menu has been opened or closed — there is no accessible presence/absence change to observe', async () => {
		const { container, getByRole, user } = renderNavigation(NAV_ITEMS);
		const toggle = getByRole('button', { name: 'Toggle menu' });

		expect(linksWithHref(container, '/ueber-uns')).toHaveLength(2);

		await user.click(toggle);
		expect(linksWithHref(container, '/ueber-uns')).toHaveLength(2);

		await user.click(toggle);
		expect(linksWithHref(container, '/ueber-uns')).toHaveLength(2);
	});
});
