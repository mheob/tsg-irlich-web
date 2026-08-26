import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { setPathname } from '../../../test-utils/setup-dom';
import Breadcrumb from './breadcrumb';

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

	// Renamed from "accumulates the link paths across more than two segments...": the truncated
	// array (`breadcrumbItems.slice(0, LAST_INDEX)`) only ever holds two entries for a three-segment
	// path, so this never drives the accumulator past its second iteration — it is the same
	// accumulation as the two-segment case above, plus one more correct entry. It does NOT reach the
	// accumulator bug pinned below, which only surfaces from the third entry onward.
	it('accumulates two link paths correctly for a three-segment pathname, still dropping the last segment from the links', () => {
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

	// Regression case: `getBreadcrumbItemsPaths` (`breadcrumb.tsx:25-29`) resets
	// `breadcrumbItemsPathsLast` to the bare `/${item}` instead of the accumulated `path`, so from
	// the third link onward the href is wrong. For `/a/b/c/d` the third link should be `/a/b/c` but
	// is actually `/b/c` — the accumulator only remembers the single previous segment. Unreachable
	// today (the deepest route has three segments, and the array is truncated to two links before
	// this ever shows), so not fixed here — this pins the actual, buggy output.
	it('documents the accumulator bug: the third link onward loses everything but the previous single segment, for a four-segment pathname', () => {
		setPathname('/a/b/c/d');
		const { getByRole } = renderWithUser(<Breadcrumb currentPage="Current Page" />);

		const nav = getByRole('navigation', { name: 'breadcrumb' });
		const links = within(nav).getAllByRole('link');

		expect(links.map((link) => [link.getAttribute('href'), link.textContent])).toStrictEqual([
			['/', 'Home'],
			['/a', 'A'],
			['/a/b', 'B'],
			['/b/c', 'C'],
		]);
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

	// Regression case: the truncated array `breadcrumbItemsPaths` (`breadcrumb.tsx`) never contains
	// the true last URL segment, so the `currentPage` fallback (`breadcrumbItemsPaths.at(LAST_INDEX)
	// ?.title`) duplicates the *second-to-last* segment's title instead. Unreachable today —
	// `Hero` (`section/hero.tsx`) always supplies `currentPage` — but a live defect in the
	// component's own optional prop contract. Not fixed here; this pins the actual output.
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
