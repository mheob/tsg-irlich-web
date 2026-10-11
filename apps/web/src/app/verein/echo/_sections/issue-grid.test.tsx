import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';
import type { EchoIssuesQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../test-utils/render';
import { IssueGrid } from './issue-grid';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
	} as unknown as typeof client,
}));

function issue(year: number) {
	return {
		_id: `echo-${year}`,
		cover: { _type: 'image', asset: { _ref: 'image-abc-1414x2000-jpg', _type: 'reference' } },
		indexable: true,
		intro: null,
		pdf: null,
		releaseDate: `${year}-04-01`,
		slug: `tsg-echo-${year}`,
		title: `TSG ECHO ${year}`,
	} as unknown as EchoIssuesQueryResult[number];
}

// Twelve issues per page after the newest one, which the wide card above the grid shows.
const PAGE = { perPage: 12, startIndex: 1 };

describe('the issue grid', () => {
	it('lists every issue with its year, linked to its page', () => {
		const { getByRole, getByText } = renderWithUser(
			<IssueGrid {...PAGE} currentPage={1} issues={[issue(2012), issue(2011)]} totalIssues={3} />,
		);

		expect(getByRole('heading', { name: 'Alle Ausgaben' })).toBeDefined();
		expect(getByRole('link', { name: /TSG ECHO 2012/u }).getAttribute('href')).toBe(
			'/verein/echo/tsg-echo-2012',
		);
		expect(getByText('2011')).toBeDefined();
	});

	it('needs no pagination for a single page', () => {
		const { queryByRole } = renderWithUser(
			<IssueGrid {...PAGE} currentPage={1} issues={[issue(2012)]} totalIssues={13} />,
		);

		expect(queryByRole('navigation', { name: 'Seiten' })).toBeNull();
	});

	it('leads to the next page of the archive when there is one', () => {
		const { getByRole, getByText } = renderWithUser(
			<IssueGrid {...PAGE} currentPage={1} issues={[issue(2012)]} totalIssues={14} />,
		);

		expect(getByRole('link', { name: 'Nächste Seite' }).getAttribute('href')).toBe(
			'/verein/echo?seite=2',
		);
		expect(getByText('Ausgaben 2–13 von 14')).not.toBeNull();
	});

	it('shows the cover of a hidden issue through the archive path', () => {
		const { getByAltText } = renderWithUser(
			<IssueGrid
				{...PAGE}
				currentPage={1}
				issues={[{ ...issue(1984), indexable: false }]}
				totalIssues={2}
			/>,
		);

		expect(getByAltText('Titelseite von TSG ECHO 1984').getAttribute('src')).toMatch(
			/^\/echo-archiv\/images\//u,
		);
	});
});
