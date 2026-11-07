import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NewsOverview } from '../../_shared/news-overview';
import { getNewsOverviewMetadata } from '../../_shared/news-overview-metadata';
import NewsOverviewLaterPage, { generateMetadata, generateStaticParams } from './page';

vi.mock(import('../../_shared/news-overview'), () => ({ NewsOverview: vi.fn() }));
vi.mock(import('../../_shared/news-overview-metadata'), () => ({
	getNewsOverviewMetadata: vi.fn(),
}));

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

function routeProps(page: string): PageProps<'/news/seite/[page]'> {
	// `PageProps<'/news/seite/[page]'>` types the params as a promise.
	return { params: Promise.resolve({ page }) } as unknown as PageProps<'/news/seite/[page]'>;
}

describe('later page of the news overview', () => {
	afterEach(() => {
		vi.mocked(getNewsOverviewMetadata).mockReset();
		vi.mocked(notFound).mockClear();
	});

	it('prerenders no page at build time, so every page is cached on its first request', () => {
		expect(generateStaticParams()).toStrictEqual([]);
	});

	it('shows the page the rewrite passes on', async () => {
		const page = await NewsOverviewLaterPage(routeProps('3'));

		expect(page.type).toBe(NewsOverview);
		expect(page.props).toStrictEqual({ currentPage: 3 });
	});

	it('describes that page', async () => {
		vi.mocked(getNewsOverviewMetadata).mockResolvedValue({ title: 'News' });

		await expect(generateMetadata(routeProps('3'))).resolves.toStrictEqual({ title: 'News' });
		expect(getNewsOverviewMetadata).toHaveBeenCalledWith(3);
	});

	it.each(['1', '02', 'abc'])('answers the segment %s with not found', async (segment) => {
		await expect(NewsOverviewLaterPage(routeProps(segment))).rejects.toThrow('NEXT_NOT_FOUND');
		await expect(generateMetadata(routeProps(segment))).rejects.toThrow('NEXT_NOT_FOUND');
		expect(getNewsOverviewMetadata).not.toHaveBeenCalled();
	});
});
