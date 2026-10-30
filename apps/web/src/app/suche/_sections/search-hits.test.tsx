import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { buildSearchHits, buildSearchResult } from '../../../../test-utils/search-fixtures';
import { SearchHits } from './search-hits';

const FOUND = buildSearchResult({
	news: buildSearchHits('Bericht', 3),
	pages: buildSearchHits('Gruppe', 4),
	totals: { news: 26, pages: 4 },
});

describe('what a search leads to', () => {
	it('sums both groups in the summary', () => {
		const { getByText } = renderWithUser(<SearchHits currentPage={1} result={FOUND} tab="alle" />);

		// The count is bold, so the sentence is spread over two nodes.
		expect(getByText('30 Treffer', { selector: 'strong' }).parentElement?.textContent).toBe(
			'30 Treffer für „Tanzen“',
		);
	});

	it('shows the tabs and the hits below the summary', () => {
		const { getByRole } = renderWithUser(<SearchHits currentPage={1} result={FOUND} tab="alle" />);

		expect(getByRole('navigation', { name: 'Trefferart' })).not.toBeNull();
		expect(getByRole('heading', { level: 2, name: 'Seiten' })).not.toBeNull();
		expect(getByRole('link', { name: 'Bericht 1' })).not.toBeNull();
	});

	it('shows the empty state of the editors instead when nothing was found', () => {
		const { getByRole, queryByRole } = renderWithUser(
			<SearchHits
				currentPage={1}
				noResults={{ links: [], title: 'Leider nichts gefunden' }}
				result={buildSearchResult()}
				tab="alle"
			/>,
		);

		expect(getByRole('heading', { level: 2, name: 'Leider nichts gefunden' })).not.toBeNull();
		expect(queryByRole('navigation', { name: 'Trefferart' })).toBeNull();
	});

	it('shows no summary of 0 hits when nothing was found', () => {
		const { queryByText } = renderWithUser(
			<SearchHits currentPage={1} result={buildSearchResult()} tab="alle" />,
		);

		expect(queryByText('0 Treffer', { selector: 'strong' })).toBeNull();
	});
});
