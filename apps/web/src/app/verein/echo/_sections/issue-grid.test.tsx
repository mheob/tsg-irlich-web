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
		intro: null,
		pdf: null,
		releaseDate: `${year}-04-01`,
		slug: `tsg-echo-${year}`,
		title: `TSG ECHO ${year}`,
	} as unknown as EchoIssuesQueryResult[number];
}

describe('the issue grid', () => {
	it('lists every issue with its year, linked to its page', () => {
		const { getByRole, getByText } = renderWithUser(
			<IssueGrid currentPage={1} issues={[issue(2012), issue(2011)]} />,
		);

		expect(getByRole('heading', { name: 'Alle Ausgaben' })).toBeDefined();
		expect(getByRole('link', { name: /TSG ECHO 2012/u }).getAttribute('href')).toBe(
			'/verein/echo/tsg-echo-2012',
		);
		expect(getByText('2011')).toBeDefined();
	});

	it('needs no pagination for a single page', () => {
		const { queryByRole } = renderWithUser(<IssueGrid currentPage={1} issues={[issue(2012)]} />);

		expect(queryByRole('link', { name: 'Weiter' })).toBeNull();
	});

	it('leads to the next page when there is one', () => {
		const { getByRole } = renderWithUser(
			<IssueGrid currentPage={1} hasNextPage issues={[issue(2012)]} />,
		);

		expect(getByRole('link', { name: 'Weiter' }).getAttribute('href')).toBe('?seite=2');
	});
});
