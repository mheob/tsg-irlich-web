import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NewsCategory } from '../_shared/news-category';
import { getNewsCategoryMetadata } from '../_shared/news-category-metadata';
import NewsCategoryPage, { generateMetadata, generateStaticParams } from './page';

vi.mock(import('../_shared/news-category'), () => ({ NewsCategory: vi.fn() }));
vi.mock(import('../_shared/news-category-metadata'), () => ({ getNewsCategoryMetadata: vi.fn() }));

function routeProps(): PageProps<'/news/[category]'> {
	// `PageProps<'/news/[category]'>` types the params as a promise.
	return {
		params: Promise.resolve({ category: 'fussball' }),
	} as unknown as PageProps<'/news/[category]'>;
}

describe('news category page', () => {
	afterEach(() => {
		vi.mocked(getNewsCategoryMetadata).mockReset();
	});

	// WEB-415: the route reads no search parameters, which would render it on every request.
	it('prerenders no category at build time, so every category is cached on its first request', () => {
		expect(generateStaticParams()).toStrictEqual([]);
	});

	it('shows the first page of the requested category', async () => {
		const page = await NewsCategoryPage(routeProps());

		expect(page.type).toBe(NewsCategory);
		expect(page.props).toStrictEqual({ categoryParameter: 'fussball', currentPage: 1 });
	});

	it('describes the first page of the requested category', async () => {
		vi.mocked(getNewsCategoryMetadata).mockResolvedValue({ title: 'Fußball' });

		await expect(generateMetadata(routeProps())).resolves.toStrictEqual({ title: 'Fußball' });
		expect(getNewsCategoryMetadata).toHaveBeenCalledWith('fussball', 1);
	});
});
