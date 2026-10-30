import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import {
	buildSearchHit,
	buildSearchHits,
	buildSearchResult,
} from '../../../../test-utils/search-fixtures';
import { SearchResults } from './search-results';

describe('the results of the „Alle“ tab', () => {
	const result = buildSearchResult({
		news: buildSearchHits('Bericht', 3),
		pages: buildSearchHits('Gruppe', 6),
		totals: { news: 26, pages: 8 },
	});

	it('groups the hits under the h2 headings „Seiten“ and „News“, with their counts', () => {
		const { getByRole, getByText } = renderWithUser(
			<SearchResults currentPage={1} result={result} tab="alle" />,
		);

		expect(getByRole('heading', { level: 2, name: 'Seiten' })).not.toBeNull();
		expect(getByRole('heading', { level: 2, name: 'News' })).not.toBeNull();
		expect(getByText('8 Treffer')).not.toBeNull();
		expect(getByText('26 Treffer')).not.toBeNull();
	});

	it('shows every page hit as a card and every news hit as a row, each linking to its hit', () => {
		const { getAllByRole, getByRole } = renderWithUser(
			<SearchResults currentPage={1} result={result} tab="alle" />,
		);

		expect(getByRole('link', { name: 'Gruppe 1' }).getAttribute('href')).toBe('/gruppe/1');
		expect(getByRole('link', { name: 'Bericht 3' }).getAttribute('href')).toBe('/bericht/3');
		expect(getAllByRole('heading', { level: 3 })).toHaveLength(9);
	});

	it('links the rest of each group to its tab, with the count of the whole group', () => {
		const { getByRole } = renderWithUser(
			<SearchResults currentPage={1} result={result} tab="alle" />,
		);

		expect(getByRole('link', { name: 'Alle 26 News-Treffer anzeigen' }).getAttribute('href')).toBe(
			'/suche?q=Tanzen&typ=news',
		);
		expect(getByRole('link', { name: 'Alle 8 Seiten-Treffer anzeigen' }).getAttribute('href')).toBe(
			'/suche?q=Tanzen&typ=seiten',
		);
	});

	it('links no rest when the group is shown in full', () => {
		const { queryByRole } = renderWithUser(
			<SearchResults
				currentPage={1}
				result={buildSearchResult({
					news: buildSearchHits('Bericht', 3),
					pages: buildSearchHits('Gruppe', 2),
					totals: { news: 3, pages: 2 },
				})}
				tab="alle"
			/>,
		);

		expect(queryByRole('link', { name: /anzeigen/u })).toBeNull();
	});

	it('leaves out a group without a hit, heading included', () => {
		const { getByRole, queryByRole } = renderWithUser(
			<SearchResults
				currentPage={1}
				result={buildSearchResult({
					pages: buildSearchHits('Gruppe', 2),
					totals: { news: 0, pages: 2 },
				})}
				tab="alle"
			/>,
		);

		expect(getByRole('heading', { level: 2, name: 'Seiten' })).not.toBeNull();
		expect(queryByRole('heading', { name: 'News' })).toBeNull();
	});

	it('marks the search words in the titles and snippets, and shows the meta line', () => {
		const { container, getByText } = renderWithUser(
			<SearchResults
				currentPage={1}
				result={buildSearchResult({
					news: [
						buildSearchHit({
							href: '/news/breitensport/auftritt',
							id: 'news-1',
							kind: 'news',
							meta: '01.03.2026 · Breitensport',
							snippet: 'Wir tanzen bei jedem Auftritt.',
							title: 'Auftritt der Gruppe',
						}),
					],
					totals: { news: 1, pages: 0 },
				})}
				tab="alle"
			/>,
		);

		expect(getByText('01.03.2026 · Breitensport')).not.toBeNull();
		expect([...container.querySelectorAll('mark')].map((mark) => mark.textContent)).toStrictEqual([
			'tanzen',
		]);
	});

	it('has no pagination, whatever the totals', () => {
		const { queryByRole } = renderWithUser(
			<SearchResults currentPage={1} result={result} tab="alle" />,
		);

		expect(queryByRole('link', { name: 'Seite 2' })).toBeNull();
	});
});

describe('the results of a tab that lists one group', () => {
	const pagesResult = buildSearchResult({
		pages: buildSearchHits('Gruppe', 10),
		totals: { news: 26, pages: 25 },
	});
	const newsResult = buildSearchResult({
		news: buildSearchHits('Bericht', 6),
		totals: { news: 26, pages: 4 },
	});

	it('shows only the group of the tab, under its heading and count', () => {
		const { getByRole, getByText, queryByRole } = renderWithUser(
			<SearchResults currentPage={1} result={pagesResult} tab="seiten" />,
		);

		expect(getByRole('heading', { level: 2, name: 'Seiten' })).not.toBeNull();
		expect(getByText('25 Treffer')).not.toBeNull();
		expect(queryByRole('heading', { name: 'News' })).toBeNull();
		expect(getByRole('link', { name: 'Gruppe 10' })).not.toBeNull();
	});

	it('shows the news of the news tab as rows', () => {
		const { getByRole, getByText } = renderWithUser(
			<SearchResults currentPage={3} result={newsResult} tab="news" />,
		);

		expect(getByRole('heading', { level: 2, name: 'News' })).not.toBeNull();
		expect(getByText('26 Treffer')).not.toBeNull();
		expect(getByRole('link', { name: 'Bericht 6' }).getAttribute('href')).toBe('/bericht/6');
	});

	it('pages through the tab in tens, keeping the search term and the tab in every link', () => {
		const { getByRole, getByText } = renderWithUser(
			<SearchResults currentPage={2} result={pagesResult} tab="seiten" />,
		);

		expect(getByText('Treffer 11–20 von 25')).not.toBeNull();
		expect(getByRole('link', { name: 'Seite 1' }).getAttribute('href')).toBe(
			'/suche?q=Tanzen&typ=seiten',
		);
		expect(getByRole('link', { name: 'Seite 3' }).getAttribute('href')).toBe(
			'/suche?q=Tanzen&typ=seiten&seite=3',
		);
		expect(getByRole('link', { name: 'Seite 2' }).getAttribute('aria-current')).toBe('page');
	});

	it('pages through the news tab by the news total', () => {
		const { getByRole, queryByRole } = renderWithUser(
			<SearchResults currentPage={1} result={newsResult} tab="news" />,
		);

		expect(getByRole('link', { name: 'Seite 3' }).getAttribute('href')).toBe(
			'/suche?q=Tanzen&typ=news&seite=3',
		);
		expect(queryByRole('link', { name: 'Seite 4' })).toBeNull();
	});

	it('has no pagination when the hits fit on one page', () => {
		const { queryByRole } = renderWithUser(
			<SearchResults
				currentPage={1}
				result={buildSearchResult({
					pages: buildSearchHits('Gruppe', 10),
					totals: { news: 0, pages: 10 },
				})}
				tab="seiten"
			/>,
		);

		expect(queryByRole('link', { name: 'Seite 2' })).toBeNull();
	});

	it('still shows the heading with 0 hits when the other group holds all of them', () => {
		const { getByRole, getByText } = renderWithUser(
			<SearchResults
				currentPage={1}
				result={buildSearchResult({ totals: { news: 5, pages: 0 } })}
				tab="seiten"
			/>,
		);

		expect(getByRole('heading', { level: 2, name: 'Seiten' })).not.toBeNull();
		expect(getByText('0 Treffer')).not.toBeNull();
	});
});
