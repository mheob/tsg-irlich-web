import type { Metadata } from 'next';

import { sanityFetch } from '@/lib/sanity/live';
import { newsOverviewPageQuery } from '@/lib/sanity/queries/pages/news-overview';
import { getPageMetadata } from '@/utils/metadata';
import { getPaginatedPath } from '@/utils/pagination';

/**
 * Builds the metadata of a page of the news overview. `/news` is the first page, and
 * `/news/seite/[page]` serves the later ones, which are addressed as `/news?seite=N`.
 *
 * @param currentPage - The page shown, from 1.
 * @returns The metadata, empty without the overview document.
 */
async function getNewsOverviewMetadata(currentPage: number): Promise<Metadata> {
	const { data: page } = await sanityFetch({ query: newsOverviewPageQuery, stega: false });

	if (!page) {
		return {};
	}

	return getPageMetadata({
		image: page.heroImage,
		meta: page.meta,
		path: getPaginatedPath('/news', currentPage),
		title: page.title,
	});
}

export { getNewsOverviewMetadata };
