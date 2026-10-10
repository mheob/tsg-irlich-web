import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';
import type { EchoIssuesQueryResult } from '@/types/sanity.types';

import { renderWithUser } from '../../../../../test-utils/render';
import { LatestIssue } from './latest-issue';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
	} as unknown as typeof client,
}));

const ISSUE = {
	_id: 'echo-2025',
	cover: { _type: 'image', asset: { _ref: 'image-abc-1414x2000-jpg', _type: 'reference' } },
	indexable: true,
	intro: 'Ein Rückblick auf das Vereinsjahr.',
	pdf: {
		originalFilename: 'tsg-echo-2025.pdf',
		size: 1_048_576,
		url: 'https://cdn.sanity.io/x.pdf',
	},
	releaseDate: '2025-04-01',
	slug: 'tsg-echo-2025',
	title: 'TSG ECHO 2025',
} as unknown as EchoIssuesQueryResult[number];

describe('the newest issue', () => {
	it('names the issue as the newest one with its year', () => {
		const { getByText } = renderWithUser(<LatestIssue issue={ISSUE} />);

		expect(getByText('Neueste Ausgabe · 2025')).toBeDefined();
	});

	it('leads to the issue from its title, its cover and its button', () => {
		const { getAllByRole } = renderWithUser(<LatestIssue issue={ISSUE} />);

		const hrefs = getAllByRole('link').map((link) => link.getAttribute('href'));

		expect(hrefs.filter((href) => href === '/verein/echo/tsg-echo-2025')).toHaveLength(3);
	});

	it('offers the PDF with its size', () => {
		const { getByRole } = renderWithUser(<LatestIssue issue={ISSUE} />);

		expect(getByRole('link', { name: 'PDF herunterladen (1.00 MB)' }).getAttribute('href')).toBe(
			'https://cdn.sanity.io/x.pdf?dl=tsg-echo-2025.pdf',
		);
	});

	it('describes its cover', () => {
		const { getByAltText } = renderWithUser(<LatestIssue issue={ISSUE} />);

		expect(getByAltText('Titelseite von TSG ECHO 2025')).toBeDefined();
	});

	// Review focus 5.
	it('offers no download without a PDF', () => {
		const { queryByRole } = renderWithUser(<LatestIssue issue={{ ...ISSUE, pdf: null }} />);

		expect(queryByRole('link', { name: /PDF herunterladen/u })).toBeNull();
	});

	// Review focus 5: /_next/image would serve the cover without the noindex header.
	it('shows the cover of a hidden issue through the archive path', () => {
		const { getByAltText } = renderWithUser(<LatestIssue issue={{ ...ISSUE, indexable: false }} />);

		expect(getByAltText('Titelseite von TSG ECHO 2025').getAttribute('src')).toMatch(
			/^\/echo-archiv\/images\//u,
		);
	});
});
