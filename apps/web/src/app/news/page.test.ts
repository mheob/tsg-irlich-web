import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NewsOverview } from './_shared/news-overview';
import { getNewsOverviewMetadata } from './_shared/news-overview-metadata';
import NewsOverviewPage, { generateMetadata } from './page';

vi.mock(import('./_shared/news-overview'), () => ({ NewsOverview: vi.fn() }));
vi.mock(import('./_shared/news-overview-metadata'), () => ({ getNewsOverviewMetadata: vi.fn() }));

describe('news overview page', () => {
	afterEach(() => {
		vi.mocked(getNewsOverviewMetadata).mockReset();
	});

	// WEB-415: the route reads no search parameters, which would render it on every request.
	it('shows the first page', () => {
		const page = NewsOverviewPage();

		expect(page.type).toBe(NewsOverview);
		expect(page.props).toStrictEqual({ currentPage: 1 });
	});

	it('describes the first page', async () => {
		vi.mocked(getNewsOverviewMetadata).mockResolvedValue({ title: 'News' });

		await expect(generateMetadata()).resolves.toStrictEqual({ title: 'News' });
		expect(getNewsOverviewMetadata).toHaveBeenCalledWith(1);
	});
});
