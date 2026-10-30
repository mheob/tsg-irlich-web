import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { PopularSearches } from './popular-searches';

describe('the popular searches', () => {
	it('heads the list with its title', () => {
		const { getByRole } = renderWithUser(
			<PopularSearches terms={['Tanzen']} title="Häufig gesucht" />,
		);

		expect(getByRole('heading', { level: 2, name: 'Häufig gesucht' })).not.toBeNull();
	});

	it('links every term to the search for it, in the given order', () => {
		const { getAllByRole } = renderWithUser(
			<PopularSearches terms={['Tanzen', '1. Mannschaft', 'TSG-Echo']} title="Häufig gesucht" />,
		);

		expect(
			getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')]),
		).toStrictEqual([
			['Tanzen', '/suche?q=Tanzen'],
			['1. Mannschaft', '/suche?q=1.%20Mannschaft'],
			['TSG-Echo', '/suche?q=TSG-Echo'],
		]);
	});

	it('shows nothing without a term, not even the heading', () => {
		const { container } = renderWithUser(<PopularSearches terms={[]} title="Häufig gesucht" />);

		expect(container.textContent).toBe('');
	});
});
