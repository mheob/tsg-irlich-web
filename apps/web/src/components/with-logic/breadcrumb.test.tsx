import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { setPathname } from '../../../test-utils/setup-dom';
import Breadcrumb from './breadcrumb';

// `getBreadcrumbItemsPaths` (`breadcrumb.tsx`) builds its `path`/`title` pairs from
// `pathname.split('/').slice(1).slice(0, LAST_INDEX)` — i.e. every segment *except the last one*.
// The component's fallback for an omitted `currentPage` prop then reads
// `breadcrumbItemsPaths.at(LAST_INDEX)?.title`, which is the last element of that already-truncated
// array, not the true final URL segment. For a two-segment path like `/verein/vorstand-team` this
// means the fallback "current page" duplicates the *second-to-last* segment's title ("Verein") and
// the real last segment ("vorstand-team" → "Vorstand Team") never appears anywhere in the tree. In
// this codebase `currentPage` is always supplied (`Hero` in `section/hero.tsx` passes its required
// `title` prop straight through), so the bug is not reachable today, but it is a live defect in the
// component's own public (optional) prop contract. Reported here, not fixed — see the last test
// below, which pins the actual (buggy) output rather than the fallback's apparent intent.
describe('breadcrumb', () => {
	it('renders the home link, one link per pathname segment before the last, and the current page as plain text', () => {
		setPathname('/verein/vorstand-team');
		const { getByRole, getByText } = renderWithUser(<Breadcrumb currentPage="Der Vorstand" />);

		const nav = getByRole('navigation', { name: 'breadcrumb' });
		const links = within(nav).getAllByRole('link');

		expect(links.map((link) => [link.getAttribute('href'), link.textContent])).toStrictEqual([
			['/', 'Home'],
			['/verein', 'Verein'],
		]);
		expect(within(nav).queryByRole('link', { name: 'Der Vorstand' })).toBeNull();
		expect(getByText('Der Vorstand')).not.toBeNull();
	});

	it('accumulates the link paths across more than two segments and still drops the last one from the links', () => {
		setPathname('/a/b/c');
		const { getByRole } = renderWithUser(<Breadcrumb currentPage="Current Page" />);

		const nav = getByRole('navigation', { name: 'breadcrumb' });
		const links = within(nav).getAllByRole('link');

		expect(links.map((link) => [link.getAttribute('href'), link.textContent])).toStrictEqual([
			['/', 'Home'],
			['/a', 'A'],
			['/a/b', 'B'],
		]);
		expect(within(nav).queryByRole('link', { name: /c/iu })).toBeNull();
	});

	it('humanises a hyphenated, mixed-case segment into title-cased words', () => {
		setPathname('/MEIN-Verein/team');
		const { getByRole } = renderWithUser(<Breadcrumb currentPage="Teamübersicht" />);

		const nav = getByRole('navigation', { name: 'breadcrumb' });

		expect(within(nav).getByRole('link', { name: 'Mein Verein' })).not.toBeNull();
	});

	it('marks the current page as programmatically identifiable through aria-current, regardless of its class-only styling', () => {
		setPathname('/verein/vorstand-team');
		const { getByText } = renderWithUser(<Breadcrumb currentPage="Der Vorstand" />);

		expect(getByText('Der Vorstand').getAttribute('aria-current')).toBe('page');
	});

	it('duplicates the last *linked* segment as the fallback current page instead of the true final URL segment, when currentPage is omitted', () => {
		setPathname('/verein/vorstand-team');
		const { getAllByText, queryByText } = renderWithUser(<Breadcrumb />);

		const vereinMatches = getAllByText('Verein');

		expect(vereinMatches).toHaveLength(2);
		expect(vereinMatches[0].tagName).toBe('A');
		expect(vereinMatches[1].getAttribute('aria-current')).toBe('page');
		// The true last segment's humanised label is dropped entirely — it never appears as a link
		// (expected) nor as the current-page text (the bug).
		expect(queryByText('Vorstand Team')).toBeNull();
	});
});
