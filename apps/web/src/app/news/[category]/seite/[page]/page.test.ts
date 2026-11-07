import { notFound } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NewsCategory } from '../../../_shared/news-category';
import { getNewsCategoryMetadata } from '../../../_shared/news-category-metadata';
import NewsCategoryLaterPage, { generateMetadata, generateStaticParams } from './page';

vi.mock(import('../../../_shared/news-category'), () => ({ NewsCategory: vi.fn() }));
vi.mock(import('../../../_shared/news-category-metadata'), () => ({
	getNewsCategoryMetadata: vi.fn(),
}));

vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));

function routeProps(page: string): PageProps<'/news/[category]/seite/[page]'> {
	// `PageProps<'/news/[category]/seite/[page]'>` types the params as a promise.
	return {
		params: Promise.resolve({ category: 'fussball', page }),
	} as unknown as PageProps<'/news/[category]/seite/[page]'>;
}

describe('later page of a news category', () => {
	afterEach(() => {
		vi.mocked(getNewsCategoryMetadata).mockReset();
		vi.mocked(notFound).mockClear();
	});

	it('prerenders no page at build time, so every page is cached on its first request', () => {
		expect(generateStaticParams()).toStrictEqual([]);
	});

	it('shows the page of the category the rewrite passes on', async () => {
		const page = await NewsCategoryLaterPage(routeProps('2'));

		expect(page.type).toBe(NewsCategory);
		expect(page.props).toStrictEqual({ categoryParameter: 'fussball', currentPage: 2 });
	});

	it('describes that page', async () => {
		vi.mocked(getNewsCategoryMetadata).mockResolvedValue({ title: 'Fußball' });

		await expect(generateMetadata(routeProps('2'))).resolves.toStrictEqual({ title: 'Fußball' });
		expect(getNewsCategoryMetadata).toHaveBeenCalledWith('fussball', 2);
	});

	it.each(['1', '02', 'abc'])('answers the segment %s with not found', async (segment) => {
		await expect(NewsCategoryLaterPage(routeProps(segment))).rejects.toThrow('NEXT_NOT_FOUND');
		await expect(generateMetadata(routeProps(segment))).rejects.toThrow('NEXT_NOT_FOUND');
		expect(getNewsCategoryMetadata).not.toHaveBeenCalled();
	});
});
