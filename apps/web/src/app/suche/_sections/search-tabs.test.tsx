import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { SearchTabs } from './search-tabs';

const TOTALS = { news: 26, pages: 4 };

describe('the tabs of the search page', () => {
	it('is a navigation called „Trefferart“', () => {
		const { getByRole } = renderWithUser(<SearchTabs query="Tanzen" tab="alle" totals={TOTALS} />);

		expect(getByRole('navigation', { name: 'Trefferart' })).not.toBeNull();
	});

	it('links every tab with its count in the name, to the same search', () => {
		const { getByRole } = renderWithUser(<SearchTabs query="Tanzen" tab="alle" totals={TOTALS} />);

		expect(getByRole('link', { name: 'Alle 30' }).getAttribute('href')).toBe('/suche?q=Tanzen');
		expect(getByRole('link', { name: 'Seiten 4' }).getAttribute('href')).toBe(
			'/suche?q=Tanzen&typ=seiten',
		);
		expect(getByRole('link', { name: 'News 26' }).getAttribute('href')).toBe(
			'/suche?q=Tanzen&typ=news',
		);
	});

	it.each([
		['alle', 'Alle 30'],
		['seiten', 'Seiten 4'],
		['news', 'News 26'],
	] as const)('marks only the tab %s as the current page', (tab, name) => {
		const { getAllByRole, getByRole } = renderWithUser(
			<SearchTabs query="Tanzen" tab={tab} totals={TOTALS} />,
		);

		expect(getByRole('link', { name }).getAttribute('aria-current')).toBe('page');
		expect(
			getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page'),
		).toHaveLength(1);
	});

	it('keeps the search term and leaves the page number out of every link', () => {
		const { getAllByRole } = renderWithUser(
			<SearchTabs query="Fußball Jugend" tab="news" totals={TOTALS} />,
		);

		expect(getAllByRole('link').map((link) => link.getAttribute('href'))).toStrictEqual([
			'/suche?q=Fu%C3%9Fball%20Jugend',
			'/suche?q=Fu%C3%9Fball%20Jugend&typ=seiten',
			'/suche?q=Fu%C3%9Fball%20Jugend&typ=news',
		]);
	});

	it('counts a tab without a hit as 0', () => {
		const { getByRole } = renderWithUser(
			<SearchTabs query="Tanzen" tab="alle" totals={{ news: 0, pages: 4 }} />,
		);

		expect(getByRole('link', { name: 'News 0' })).not.toBeNull();
		expect(getByRole('link', { name: 'Alle 4' })).not.toBeNull();
	});
});
