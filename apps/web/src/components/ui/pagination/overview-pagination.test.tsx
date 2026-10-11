import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { OverviewPagination } from './overview-pagination';

// The news overview: three articles above the list, six per page, 191 in total — 32 pages.
const NEWS = {
	basePath: '/news',
	itemLabel: 'Artikel',
	perPage: 6,
	startIndex: 3,
	totalItems: 191,
};

describe('overview pagination', () => {
	it('renders nothing when everything fits on one page', () => {
		const { container } = renderWithUser(
			<OverviewPagination {...NEWS} currentPage={1} perPage={9} startIndex={0} totalItems={9} />,
		);

		expect(container.innerHTML).toBe('');
	});

	it('is a navigation named after the pages it links', () => {
		const { getByRole } = renderWithUser(<OverviewPagination {...NEWS} currentPage={5} />);

		expect(getByRole('navigation', { name: 'Seiten' })).not.toBeNull();
	});

	it('links the first, the last and the neighbours of the current page by their number', () => {
		const { getAllByRole } = renderWithUser(<OverviewPagination {...NEWS} currentPage={5} />);

		const pages = getAllByRole('link', { name: /^Seite \d+$/u });

		expect(pages.map((link) => link.textContent)).toStrictEqual(['1', '4', '5', '6', '32']);
	});

	it('announces the linked pages and the two directions, but not the skipped pages', () => {
		const { getAllByRole } = renderWithUser(<OverviewPagination {...NEWS} currentPage={5} />);

		expect(getAllByRole('listitem')).toHaveLength(7);
	});

	it('marks the current page', () => {
		const { getByRole } = renderWithUser(<OverviewPagination {...NEWS} currentPage={5} />);

		expect(getByRole('link', { name: 'Seite 5' }).getAttribute('aria-current')).toBe('page');
		expect(getByRole('link', { name: 'Seite 4' }).getAttribute('aria-current')).toBeNull();
	});

	it('links every page by its canonical path, the first one without a parameter', () => {
		const { getByRole } = renderWithUser(<OverviewPagination {...NEWS} currentPage={2} />);

		expect(getByRole('link', { name: 'Seite 1' }).getAttribute('href')).toBe('/news');
		expect(getByRole('link', { name: 'Seite 3' }).getAttribute('href')).toBe('/news?seite=3');
		expect(getByRole('link', { name: 'Vorherige Seite' }).getAttribute('href')).toBe('/news');
		expect(getByRole('link', { name: 'Nächste Seite' }).getAttribute('href')).toBe('/news?seite=3');
	});

	// The arrow at an end stays visible, faded, so the bar keeps its width. Assistive technology
	// skips it: the current page already says where the list stands.
	it('offers no previous page on the first one', () => {
		const { getAllByRole, getByRole, queryByRole } = renderWithUser(
			<OverviewPagination {...NEWS} currentPage={1} />,
		);

		expect(queryByRole('link', { name: 'Vorherige Seite' })).toBeNull();
		expect(getByRole('link', { name: 'Nächste Seite' }).getAttribute('href')).toBe('/news?seite=2');
		// Pages 1 to 5, the last page and the next one.
		expect(getAllByRole('listitem')).toHaveLength(7);
	});

	it('offers no next page on the last one', () => {
		const { getAllByRole, getByRole, queryByRole } = renderWithUser(
			<OverviewPagination {...NEWS} currentPage={32} />,
		);

		expect(queryByRole('link', { name: 'Nächste Seite' })).toBeNull();
		expect(getByRole('link', { name: 'Vorherige Seite' }).getAttribute('href')).toBe(
			'/news?seite=31',
		);
		// The previous page, the first page and pages 28 to 32.
		expect(getAllByRole('listitem')).toHaveLength(7);
	});

	it.each([
		{ currentPage: 1, range: 'Artikel 4–9 von 191' },
		{ currentPage: 5, range: 'Artikel 28–33 von 191' },
		{ currentPage: 32, range: 'Artikel 190–191 von 191' },
	])('names the articles of page $currentPage', ({ currentPage, range }) => {
		const { getByText } = renderWithUser(
			<OverviewPagination {...NEWS} currentPage={currentPage} />,
		);

		expect(getByText(range)).not.toBeNull();
	});

	it('names the items by the label it was given', () => {
		const { getByText } = renderWithUser(
			<OverviewPagination
				basePath="/verein/echo"
				currentPage={2}
				itemLabel="Ausgaben"
				perPage={12}
				startIndex={1}
				totalItems={41}
			/>,
		);

		expect(getByText('Ausgaben 14–25 von 41')).not.toBeNull();
	});
});
